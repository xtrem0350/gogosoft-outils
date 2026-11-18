ALTER TABLE public.user_roles_by_shop
  ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;
