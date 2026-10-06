CREATE TABLE IF NOT EXISTS public.platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.activity_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage activity modules" ON public.activity_modules;
CREATE POLICY "Super admins manage activity modules"
  ON public.activity_modules FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins manage shop modules" ON public.shop_modules;
CREATE POLICY "Super admins manage shop modules"
  ON public.shop_modules FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins insert audit logs" ON public.audit_logs;
CREATE POLICY "Super admins insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins read audit logs" ON public.audit_logs;
CREATE POLICY "Super admins read audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Authenticated users read platform notifications" ON public.platform_notifications;
CREATE POLICY "Authenticated users read platform notifications"
  ON public.platform_notifications FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Super admins send platform notifications" ON public.platform_notifications;
CREATE POLICY "Super admins send platform notifications"
  ON public.platform_notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Users create own support tickets" ON public.platform_support_tickets;
CREATE POLICY "Users create own support tickets"
  ON public.platform_support_tickets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users and super admins read support tickets" ON public.platform_support_tickets;
CREATE POLICY "Users and super admins read support tickets"
  ON public.platform_support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins update support tickets" ON public.platform_support_tickets;
CREATE POLICY "Super admins update support tickets"
  ON public.platform_support_tickets FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());