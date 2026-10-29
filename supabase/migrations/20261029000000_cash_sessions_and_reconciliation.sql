-- 1. Table cash_sessions (ouverture / fermeture de caisse)
CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL REFERENCES auth.users(id),
  opened_at timestamptz NOT NULL DEFAULT now(),
  opening_amount integer NOT NULL DEFAULT 0,
  closed_by uuid REFERENCES auth.users(id),
  closed_at timestamptz,
  closing_amount integer,
  theoretical_amount integer,
  difference integer,
  status text NOT NULL DEFAULT 'ouverte' CHECK (status IN ('ouverte', 'fermee')),
  notes text
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS cash_sessions_shop_status_idx
  ON public.cash_sessions (shop_id, status);

-- 2. Ajouter les colonnes de rapprochement a cash_closures (si pas deja presentes)
ALTER TABLE public.cash_closures
  ADD COLUMN IF NOT EXISTS actual_amount integer,
  ADD COLUMN IF NOT EXISTS theoretical_amount integer,
  ADD COLUMN IF NOT EXISTS difference integer,
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.cash_sessions(id);

-- 3. RLS sur cash_sessions (owner + caissier peuvent lire, owner peut tout voir)
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_sessions_select_owner_caissier"
  ON public.cash_sessions FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier')
    )
  );

CREATE POLICY "cash_sessions_insert_owner_caissier"
  ON public.cash_sessions FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier')
    )
  );

CREATE POLICY "cash_sessions_update_owner_caissier"
  ON public.cash_sessions FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier')
    )
  );
