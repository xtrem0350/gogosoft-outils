ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_super_admin
  ON public.profiles(is_super_admin)
  WHERE is_super_admin = true;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

DROP POLICY IF EXISTS "Super admin view all profiles" ON public.profiles;
CREATE POLICY "Super admin view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin view all shops" ON public.shops;
CREATE POLICY "Super admin view all shops"
  ON public.shops FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin view all shop members" ON public.shop_members;
CREATE POLICY "Super admin view all shop members"
  ON public.shop_members FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin view all subscriptions" ON public.subscriptions;
CREATE POLICY "Super admin view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin view all payments" ON public.payments;
CREATE POLICY "Super admin view all payments"
  ON public.payments FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin view all clients" ON public.clients;
CREATE POLICY "Super admin view all clients"
  ON public.clients FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin view all workshop tickets" ON public.workshop_tickets;
CREATE POLICY "Super admin view all workshop tickets"
  ON public.workshop_tickets FOR SELECT
  USING (public.is_super_admin());
