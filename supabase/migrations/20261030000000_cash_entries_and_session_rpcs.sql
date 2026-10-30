-- 1. Table cash_entries (entrées manuelles)
CREATE TABLE IF NOT EXISTS public.cash_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('cash','wave','orange_money','mtn','moov')),
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cash_entries_shop_created_idx
  ON public.cash_entries (shop_id, created_at DESC);

ALTER TABLE public.cash_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_entries_select_owner_caissier"
  ON public.cash_entries FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier')
    )
  );

-- 2. RPC open_cash_session
CREATE OR REPLACE FUNCTION public.open_cash_session(
  p_shop_id uuid,
  p_opening_amount integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_session_id uuid;
  v_authorized boolean;
  v_existing RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilisateur non authentifie.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles_by_shop
    WHERE shop_id = p_shop_id AND user_id = v_user_id
      AND role IN ('owner', 'caissier')
  ) INTO v_authorized;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Non autorisé à ouvrir une caisse pour cette boutique.';
  END IF;

  SELECT * INTO v_existing FROM public.cash_sessions
  WHERE shop_id = p_shop_id AND status = 'ouverte'
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Une session de caisse est déjà ouverte (id: %).', v_existing.id;
  END IF;

  INSERT INTO public.cash_sessions (shop_id, opened_by, opening_amount, status)
  VALUES (p_shop_id, v_user_id, p_opening_amount, 'ouverte')
  RETURNING id INTO v_session_id;

  INSERT INTO public.audit_logs (shop_id, user_id, action, entity, entity_id, metadata)
  VALUES (p_shop_id, v_user_id, 'cash_session_opened', 'cash_session', v_session_id,
    jsonb_build_object('opening_amount', p_opening_amount));

  RETURN jsonb_build_object('success', true, 'session_id', v_session_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.open_cash_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_cash_session(uuid, integer) TO authenticated;

-- 3. RPC close_cash_session
CREATE OR REPLACE FUNCTION public.close_cash_session(
  p_session_id uuid,
  p_closing_amount integer,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_session RECORD;
  v_authorized boolean;
  v_theoretical integer;
  v_difference integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilisateur non authentifie.'; END IF;

  SELECT * INTO v_session FROM public.cash_sessions
  WHERE id = p_session_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Session introuvable.'; END IF;
  IF v_session.status <> 'ouverte' THEN RAISE EXCEPTION 'Session déjà fermée.'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles_by_shop
    WHERE shop_id = v_session.shop_id AND user_id = v_user_id
      AND role IN ('owner', 'caissier')
  ) INTO v_authorized;

  IF NOT v_authorized THEN RAISE EXCEPTION 'Non autorisé à fermer cette caisse.'; END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_theoretical FROM (
    SELECT amount FROM public.workshop_payments
      WHERE shop_id = v_session.shop_id AND created_at >= v_session.opened_at
    UNION ALL
    SELECT total_price AS amount FROM public.sales
      WHERE shop_id = v_session.shop_id AND payment_status = 'payee'
        AND created_at >= v_session.opened_at
    UNION ALL
    SELECT amount FROM public.cash_entries
      WHERE shop_id = v_session.shop_id AND created_at >= v_session.opened_at
    UNION ALL
    SELECT -amount FROM public.cash_exits
      WHERE shop_id = v_session.shop_id AND created_at >= v_session.opened_at
  ) AS movements;

  v_theoretical := v_theoretical + v_session.opening_amount;
  v_difference := p_closing_amount - v_theoretical;

  UPDATE public.cash_sessions SET
    closed_by = v_user_id, closed_at = now(),
    closing_amount = p_closing_amount,
    theoretical_amount = v_theoretical,
    difference = v_difference,
    status = 'fermee', notes = p_notes
  WHERE id = p_session_id;

  INSERT INTO public.audit_logs (shop_id, user_id, action, entity, entity_id, metadata)
  VALUES (v_session.shop_id, v_user_id, 'cash_session_closed', 'cash_session', p_session_id,
    jsonb_build_object('opening_amount', v_session.opening_amount, 'closing_amount', p_closing_amount,
      'theoretical_amount', v_theoretical, 'difference', v_difference, 'notes', p_notes));

  RETURN jsonb_build_object('success', true, 'session_id', p_session_id,
    'theoretical_amount', v_theoretical, 'closing_amount', p_closing_amount, 'difference', v_difference);
END;
$function$;

REVOKE ALL ON FUNCTION public.close_cash_session(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_cash_session(uuid, integer, text) TO authenticated;

-- 4. RPC create_cash_entry
CREATE OR REPLACE FUNCTION public.create_cash_entry(
  p_shop_id uuid,
  p_amount integer,
  p_method text,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_authorized boolean;
  v_entry_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilisateur non authentifie.'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles_by_shop
    WHERE shop_id = p_shop_id AND user_id = v_user_id
      AND role IN ('owner', 'caissier')
  ) INTO v_authorized;

  IF NOT v_authorized THEN RAISE EXCEPTION 'Non autorisé.';
  END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Montant invalide.'; END IF;
  IF p_method NOT IN ('cash','wave','orange_money','mtn','moov') THEN
    RAISE EXCEPTION 'Mode de paiement invalide.';
  END IF;

  INSERT INTO public.cash_entries (shop_id, amount, method, description, created_by)
  VALUES (p_shop_id, p_amount, p_method, p_description, v_user_id)
  RETURNING id INTO v_entry_id;

  INSERT INTO public.audit_logs (shop_id, user_id, action, entity, entity_id, metadata)
  VALUES (p_shop_id, v_user_id, 'cash_entry_created', 'cash_entry', v_entry_id,
    jsonb_build_object('amount', p_amount, 'method', p_method, 'description', p_description));

  RETURN jsonb_build_object('success', true, 'entry_id', v_entry_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.create_cash_entry(uuid, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_cash_entry(uuid, integer, text, text) TO authenticated;
