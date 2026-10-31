-- 1. Supprimer l'ancienne version
DROP FUNCTION IF EXISTS public.accept_invitation(text, uuid, text, text, text, text, text, text);

-- 2. Créer la nouvelle version avec p_pseudo
CREATE OR REPLACE FUNCTION public.accept_invitation(
  p_code text,
  p_user_id uuid,
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_ncni text DEFAULT NULL,
  p_lieu_habitation text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_pseudo text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inv RECORD;
  new_member_id UUID;
  v_safe_pseudo text;
  v_safe_phone text;
  v_attempt integer := 0;
BEGIN
  -- Trouver l'invitation valide
  SELECT * INTO inv FROM public.pending_invitations
  WHERE code = p_code AND used = false AND expires_at > NOW() LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Code d''invitation invalide ou expiré.'; END IF;

  -- Gérer les conflits UNIQUE sur pseudo et phone
  v_safe_pseudo := NULLIF(TRIM(p_pseudo), '');
  v_safe_phone := NULLIF(TRIM(p_whatsapp), '');

  -- Si pseudo déjà pris, ajouter un suffixe
  IF v_safe_pseudo IS NOT NULL THEN
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE pseudo = v_safe_pseudo AND id <> p_user_id) AND v_attempt < 5 LOOP
      v_attempt := v_attempt + 1;
      v_safe_pseudo := TRIM(p_pseudo) || '_' || v_attempt::text;
    END LOOP;
  END IF;

  -- Si phone déjà pris, ne pas écraser (mettre NULL)
  IF v_safe_phone IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE phone = v_safe_phone AND id <> p_user_id) THEN
    v_safe_phone := NULL;
  END IF;

  -- Créer/mettre à jour le profil
  INSERT INTO public.profiles (id, full_name, email, phone, ncni, lieu_habitation, avatar_url, pseudo)
  VALUES (p_user_id, p_full_name, p_email, v_safe_phone, p_ncni, p_lieu_habitation, p_avatar_url, v_safe_pseudo)
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    ncni = COALESCE(EXCLUDED.ncni, public.profiles.ncni),
    lieu_habitation = COALESCE(EXCLUDED.lieu_habitation, public.profiles.lieu_habitation),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    pseudo = COALESCE(EXCLUDED.pseudo, public.profiles.pseudo);

  -- Creer le membre de la boutique
  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (inv.shop_id, p_user_id, inv.role)
  ON CONFLICT (shop_id, user_id) DO UPDATE SET role = EXCLUDED.role
  RETURNING id INTO new_member_id;

  -- Insérer dans user_roles_by_shop (source de vérité)
  INSERT INTO public.user_roles_by_shop (shop_id, user_id, role, enabled_at)
  VALUES (inv.shop_id, p_user_id, inv.role, NOW())
  ON CONFLICT (shop_id, user_id, role) DO NOTHING;

  -- Marquer l'invitation utilisée
  UPDATE public.pending_invitations SET used = true, used_at = NOW() WHERE id = inv.id;

  RETURN jsonb_build_object(
    'success', true,
    'shop_id', inv.shop_id,
    'role', inv.role,
    'member_id', new_member_id,
    'pseudo', v_safe_pseudo
  );
END;
$function$;

-- 3. Permissions
REVOKE ALL ON FUNCTION public.accept_invitation(text, uuid, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text, uuid, text, text, text, text, text, text, text) TO authenticated;
