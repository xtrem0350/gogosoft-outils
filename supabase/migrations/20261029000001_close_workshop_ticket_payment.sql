-- RPC atomique : encaisser un ticket atelier (entrée ou solde).
CREATE OR REPLACE FUNCTION public.close_workshop_ticket_payment(
  p_ticket_id uuid,
  p_amount integer,
  p_payment_type text,
  p_payment_method text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_ticket RECORD;
  v_payment_id uuid;
  v_new_status text;
  v_authorized boolean;
  v_stored_payment_type text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié.';
  END IF;

  SELECT *
  INTO v_ticket
  FROM public.workshop_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket introuvable.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles_by_shop
    WHERE shop_id = v_ticket.shop_id
      AND user_id = v_user_id
      AND role IN ('owner', 'caissier')
  ) INTO v_authorized;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Non autorisé à encaisser pour cette boutique.';
  END IF;

  IF p_payment_type = 'entry' THEN
    IF v_ticket.status <> 'en_attente_caissier_entree' THEN
      RAISE EXCEPTION 'Ce ticket n''est pas en attente d''encaissement d''entrée. Statut actuel : %', v_ticket.status;
    END IF;
    v_new_status := 'en_attente_technicien';
    v_stored_payment_type := 'entry';
  ELSIF p_payment_type = 'balance' THEN
    IF v_ticket.status <> 'en_attente_caissier_solde' THEN
      RAISE EXCEPTION 'Ce ticket n''est pas en attente d''encaissement de solde. Statut actuel : %', v_ticket.status;
    END IF;
    v_new_status := 'en_attente_receptionniste';
    v_stored_payment_type := 'final';
  ELSE
    RAISE EXCEPTION 'Type de paiement invalide : %', p_payment_type;
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant doit être positif.';
  END IF;

  IF p_payment_method NOT IN ('cash', 'wave', 'orange_money', 'mtn', 'moov') THEN
    RAISE EXCEPTION 'Mode de paiement invalide : %', p_payment_method;
  END IF;

  INSERT INTO public.workshop_payments (
    shop_id, ticket_id, amount, method, payment_type, received_by
  ) VALUES (
    v_ticket.shop_id, p_ticket_id, p_amount, p_payment_method, v_stored_payment_type, v_user_id
  ) RETURNING id INTO v_payment_id;

  UPDATE public.workshop_tickets
  SET status = v_new_status,
      entry_fee_paid = CASE WHEN p_payment_type = 'entry' THEN true ELSE entry_fee_paid END,
      updated_at = now()
  WHERE id = p_ticket_id;

  INSERT INTO public.audit_logs (
    shop_id, user_id, action, entity, entity_id, metadata
  ) VALUES (
    v_ticket.shop_id, v_user_id, 'workshop_payment_closed', 'workshop_ticket', p_ticket_id,
    jsonb_build_object(
      'payment_type', p_payment_type,
      'amount', p_amount,
      'payment_method', p_payment_method,
      'previous_status', v_ticket.status,
      'new_status', v_new_status,
      'payment_id', v_payment_id,
      'notes', p_notes
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'new_status', v_new_status,
    'amount', p_amount
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.close_workshop_ticket_payment(uuid, integer, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_workshop_ticket_payment(uuid, integer, text, text, text) TO authenticated;
