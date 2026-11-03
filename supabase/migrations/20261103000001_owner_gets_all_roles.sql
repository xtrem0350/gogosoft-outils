-- 1. Fonction pour attribuer tous les rôles à l'owner
CREATE OR REPLACE FUNCTION public.assign_all_roles_to_owner(p_shop_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_id uuid;
  v_role text;
BEGIN
  SELECT owner_id INTO v_owner_id FROM public.shops WHERE id = p_shop_id;
  IF v_owner_id IS NULL THEN RETURN; END IF;

  FOR v_role IN SELECT unnest(ARRAY['owner','caissier','receptionniste','magasinier','vendeur','technicien'])
  LOOP
    INSERT INTO public.user_roles_by_shop (shop_id, user_id, role, enabled_at)
    VALUES (p_shop_id, v_owner_id, v_role, NOW())
    ON CONFLICT (shop_id, user_id, role) DO NOTHING;
  END LOOP;
END;
$function$;

-- 2. Trigger après insertion dans shops
CREATE OR REPLACE FUNCTION public.trigger_assign_owner_roles()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  PERFORM public.assign_all_roles_to_owner(NEW.id);
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS after_shop_insert_assign_roles ON public.shops;
CREATE TRIGGER after_shop_insert_assign_roles
  AFTER INSERT ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_assign_owner_roles();

-- 3. Backfill : attribuer tous les rôles aux owners des boutiques existantes
DO $$
DECLARE
  v_shop RECORD;
BEGIN
  FOR v_shop IN SELECT id FROM public.shops LOOP
    PERFORM public.assign_all_roles_to_owner(v_shop.id);
  END LOOP;
END $$;

-- 4. RPC pour transférer un rôle
CREATE OR REPLACE FUNCTION public.transfer_role_to_member(
  p_shop_id uuid,
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_authorized boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles_by_shop
    WHERE shop_id = p_shop_id AND user_id = auth.uid() AND role = 'owner'
  ) INTO v_authorized;
  IF NOT v_authorized THEN RAISE EXCEPTION 'Non autorisé.'; END IF;

  IF p_role = 'owner' THEN RAISE EXCEPTION 'Impossible de transférer le rôle owner.'; END IF;
  IF p_from_user_id = p_to_user_id THEN RAISE EXCEPTION 'Source et destination identiques.'; END IF;

  DELETE FROM public.user_roles_by_shop
  WHERE shop_id = p_shop_id AND user_id = p_from_user_id AND role = p_role;

  INSERT INTO public.user_roles_by_shop (shop_id, user_id, role, enabled_at)
  VALUES (p_shop_id, p_to_user_id, p_role, NOW())
  ON CONFLICT (shop_id, user_id, role) DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.transfer_role_to_member(uuid, uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_role_to_member(uuid, uuid, uuid, text) TO authenticated;

-- 5. RPC pour retirer un rôle à un user (pour l'UI)
CREATE OR REPLACE FUNCTION public.remove_role_from_user(
  p_shop_id uuid,
  p_user_id uuid,
  p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_authorized boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles_by_shop
    WHERE shop_id = p_shop_id AND user_id = auth.uid() AND role = 'owner'
  ) INTO v_authorized;
  IF NOT v_authorized THEN RAISE EXCEPTION 'Non autorisé.'; END IF;
  IF p_role = 'owner' THEN RAISE EXCEPTION 'Impossible de retirer le rôle owner.'; END IF;

  DELETE FROM public.user_roles_by_shop
  WHERE shop_id = p_shop_id AND user_id = p_user_id AND role = p_role;

  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.remove_role_from_user(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_role_from_user(uuid, uuid, text) TO authenticated;
