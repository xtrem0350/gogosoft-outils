CREATE TABLE IF NOT EXISTS public.pending_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  role TEXT NOT NULL CHECK (
    role IN ('technicien', 'caissier', 'magasinier', 'receptionniste', 'vendeur')
  ),
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_invitations_shop
  ON public.pending_invitations(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_code_expiry
  ON public.pending_invitations(code, expires_at)
  WHERE used = false;

ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.pending_invitations TO authenticated;
GRANT ALL ON public.pending_invitations TO service_role;

DROP POLICY IF EXISTS "Shop owners view invitations" ON public.pending_invitations;
CREATE POLICY "Shop owners view invitations"
  ON public.pending_invitations FOR SELECT TO authenticated
  USING (public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "Shop owners create invitations" ON public.pending_invitations;
CREATE POLICY "Shop owners create invitations"
  ON public.pending_invitations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "Shop owners delete invitations" ON public.pending_invitations;
CREATE POLICY "Shop owners delete invitations"
  ON public.pending_invitations FOR DELETE TO authenticated
  USING (public.is_shop_owner(shop_id));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ncni TEXT,
  ADD COLUMN IF NOT EXISTS lieu_habitation TEXT;

ALTER TABLE public.shop_members
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.shop_members
  DROP CONSTRAINT IF EXISTS shop_members_role_check;

ALTER TABLE public.shop_members
  ADD CONSTRAINT shop_members_role_check
  CHECK (
    role IN (
      'owner',
      'manager',
      'technicien',
      'technicien_pc',
      'vendeur',
      'caissier',
      'magasinier',
      'receptionniste'
    )
  );

CREATE OR REPLACE FUNCTION public.get_invitation_by_code(p_code TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'id', invitation.id,
    'shop_id', invitation.shop_id,
    'shop_name', shop.name,
    'full_name', invitation.full_name,
    'whatsapp', invitation.whatsapp,
    'role', invitation.role,
    'code', invitation.code,
    'used', invitation.used,
    'used_at', invitation.used_at,
    'expires_at', invitation.expires_at,
    'created_at', invitation.created_at
  )
  FROM public.pending_invitations AS invitation
  JOIN public.shops AS shop ON shop.id = invitation.shop_id
  WHERE invitation.code = upper(btrim(p_code))
    AND invitation.used = false
    AND invitation.expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_invitation_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_code(TEXT) TO anon, authenticated;

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
