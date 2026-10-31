CREATE OR REPLACE FUNCTION public.accept_invitation(
  p_code TEXT,
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_whatsapp TEXT,
  p_ncni TEXT DEFAULT NULL,
  p_lieu_habitation TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invitation public.pending_invitations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Vous devez être connecté avec le compte qui accepte cette invitation.';
  END IF;

  SELECT *
  INTO invitation
  FROM public.pending_invitations
  WHERE code = upper(btrim(p_code))
    AND used = false
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code d''invitation invalide ou expiré.';
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    avatar_url,
    ncni,
    lieu_habitation
  )
  VALUES (
    p_user_id,
    nullif(btrim(p_full_name), ''),
    nullif(btrim(p_email), ''),
    nullif(btrim(p_whatsapp), ''),
    nullif(btrim(p_avatar_url), ''),
    nullif(btrim(p_ncni), ''),
    nullif(btrim(p_lieu_habitation), '')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = coalesce(nullif(btrim(EXCLUDED.full_name), ''), public.profiles.full_name),
      email = coalesce(nullif(btrim(EXCLUDED.email), ''), public.profiles.email),
      phone = coalesce(nullif(btrim(EXCLUDED.phone), ''), public.profiles.phone),
      avatar_url = coalesce(EXCLUDED.avatar_url, public.profiles.avatar_url),
      ncni = coalesce(EXCLUDED.ncni, public.profiles.ncni),
      lieu_habitation = coalesce(EXCLUDED.lieu_habitation, public.profiles.lieu_habitation),
      updated_at = now();

  INSERT INTO public.shop_members (shop_id, user_id, role, avatar_url)
  VALUES (invitation.shop_id, p_user_id, invitation.role, nullif(btrim(p_avatar_url), ''))
  ON CONFLICT (shop_id, user_id) DO UPDATE
  SET role = CASE
        WHEN public.shop_members.role = 'owner' THEN public.shop_members.role
        ELSE EXCLUDED.role
      END,
      avatar_url = coalesce(EXCLUDED.avatar_url, public.shop_members.avatar_url);

  INSERT INTO public.user_roles_by_shop (shop_id, user_id, role)
  VALUES (invitation.shop_id, p_user_id, invitation.role)
  ON CONFLICT DO NOTHING;

  UPDATE public.pending_invitations
  SET used = true, used_at = now()
  WHERE id = invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'shop_id', invitation.shop_id,
    'role', invitation.role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_invitation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated;

NOTIFY pgrst, 'reload schema';
