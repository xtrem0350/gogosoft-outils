-- Fonction SECURITY DEFINER pour verifier l'appartenance sans recursion RLS.
CREATE OR REPLACE FUNCTION public.user_has_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = role_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_has_role(TEXT) TO authenticated;

DROP POLICY IF EXISTS "Users view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;

CREATE POLICY "Users view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view all roles"
  ON public.user_roles FOR SELECT
  USING (public.user_has_role('admin'));
