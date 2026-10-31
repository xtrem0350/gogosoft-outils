-- 1. Ajouter les colonnes de configuration à shops
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS entry_fee_amount integer DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS entry_fee_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS entry_fee_refundable boolean DEFAULT false;

COMMENT ON COLUMN public.shops.entry_fee_amount IS 'Montant des frais d''entrée (0 = gratuit). Défaut 2000 FCFA.';
COMMENT ON COLUMN public.shops.entry_fee_enabled IS 'Si false, aucune entrée en atelier ne nécessite de paiement.';
COMMENT ON COLUMN public.shops.entry_fee_refundable IS 'Si true, les frais d''entrée peuvent être remboursés sur annulation.';

-- 2. RPC pour mettre à jour la config (owner uniquement)
CREATE OR REPLACE FUNCTION public.update_entry_fee_config(
  p_shop_id uuid,
  p_amount integer,
  p_enabled boolean,
  p_refundable boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_authorized boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Non authentifié.'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles_by_shop
    WHERE shop_id = p_shop_id AND user_id = v_user_id AND role = 'owner'
  ) INTO v_authorized;

  IF NOT v_authorized THEN RAISE EXCEPTION 'Seul l''owner peut modifier cette configuration.'; END IF;
  IF p_amount < 0 THEN RAISE EXCEPTION 'Le montant ne peut pas être négatif.'; END IF;

  UPDATE public.shops SET
    entry_fee_amount = p_amount,
    entry_fee_enabled = p_enabled,
    entry_fee_refundable = p_refundable
  WHERE id = p_shop_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.update_entry_fee_config(uuid, integer, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_entry_fee_config(uuid, integer, boolean, boolean) TO authenticated;
