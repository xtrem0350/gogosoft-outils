-- ========== SHOPS ==========
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shops TO authenticated;
GRANT ALL ON public.shops TO service_role;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shop_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','technicien')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_members TO authenticated;
GRANT ALL ON public.shop_members TO service_role;
ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;

-- Helpers SECURITY DEFINER (évitent la récursion RLS)
CREATE OR REPLACE FUNCTION public.is_shop_member(_shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = _shop_id AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_shop_owner(_shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shops WHERE id = _shop_id AND owner_id = auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION public.is_shop_member(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_shop_owner(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_shop_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_shop_owner(UUID) TO authenticated;

DROP POLICY IF EXISTS shops_select ON public.shops;
CREATE POLICY shops_select ON public.shops FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_shop_member(id));
DROP POLICY IF EXISTS shops_insert ON public.shops;
CREATE POLICY shops_insert ON public.shops FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS shops_update ON public.shops;
CREATE POLICY shops_update ON public.shops FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS shops_delete ON public.shops;
CREATE POLICY shops_delete ON public.shops FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS shop_members_select ON public.shop_members;
CREATE POLICY shop_members_select ON public.shop_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_shop_owner(shop_id));
DROP POLICY IF EXISTS shop_members_insert ON public.shop_members;
CREATE POLICY shop_members_insert ON public.shop_members FOR INSERT TO authenticated
  WITH CHECK (public.is_shop_owner(shop_id));
DROP POLICY IF EXISTS shop_members_update ON public.shop_members;
CREATE POLICY shop_members_update ON public.shop_members FOR UPDATE TO authenticated
  USING (public.is_shop_owner(shop_id)) WITH CHECK (public.is_shop_owner(shop_id));
DROP POLICY IF EXISTS shop_members_delete ON public.shop_members;
CREATE POLICY shop_members_delete ON public.shop_members FOR DELETE TO authenticated
  USING (public.is_shop_owner(shop_id));

-- ========== CLIENTS ==========
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  total_repairs INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clients_all ON public.clients;
CREATE POLICY clients_all ON public.clients FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id)) WITH CHECK (public.is_shop_member(shop_id));

-- ========== SUBSCRIPTIONS / PAYMENTS ==========
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial','mensuel','annuel')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscriptions_select ON public.subscriptions;
CREATE POLICY subscriptions_select ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS subscriptions_insert ON public.subscriptions;
CREATE POLICY subscriptions_insert ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS subscriptions_update ON public.subscriptions;
CREATE POLICY subscriptions_update ON public.subscriptions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('wave','orange_money','mtn_money','moov_money','especes')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  reference TEXT,
  plan TEXT CHECK (plan IN ('mensuel','annuel')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS payments_insert ON public.payments;
CREATE POLICY payments_insert ON public.payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS payments_update ON public.payments;
CREATE POLICY payments_update ON public.payments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========== WHATSAPP TEMPLATES / AUDIT ==========
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS whatsapp_templates_all ON public.whatsapp_templates;
CREATE POLICY whatsapp_templates_all ON public.whatsapp_templates FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id)) WITH CHECK (public.is_shop_member(shop_id));

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_shop_owner(shop_id) OR user_id = auth.uid());
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_shop_member(shop_id));

-- ========== WORKSHOP TICKETS : multi-tenant ==========
ALTER TABLE public.workshop_tickets ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.workshop_tickets ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.workshop_tickets ADD COLUMN IF NOT EXISTS price_estimate INTEGER;
ALTER TABLE public.workshop_tickets ADD COLUMN IF NOT EXISTS price_final INTEGER;
ALTER TABLE public.workshop_tickets ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

DROP POLICY IF EXISTS workshop_select ON public.workshop_tickets;
DROP POLICY IF EXISTS workshop_insert ON public.workshop_tickets;
DROP POLICY IF EXISTS workshop_update ON public.workshop_tickets;
DROP POLICY IF EXISTS workshop_delete_admin ON public.workshop_tickets;
CREATE POLICY workshop_select ON public.workshop_tickets FOR SELECT TO authenticated
  USING (public.is_shop_member(shop_id));
CREATE POLICY workshop_insert ON public.workshop_tickets FOR INSERT TO authenticated
  WITH CHECK (public.is_shop_member(shop_id));
CREATE POLICY workshop_update ON public.workshop_tickets FOR UPDATE TO authenticated
  USING (public.is_shop_member(shop_id)) WITH CHECK (public.is_shop_member(shop_id));
CREATE POLICY workshop_delete ON public.workshop_tickets FOR DELETE TO authenticated
  USING (public.is_shop_owner(shop_id));

-- ========== TOOLS : rattachement boutique ==========
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS tools_select ON public.tools;
DROP POLICY IF EXISTS tools_insert ON public.tools;
DROP POLICY IF EXISTS tools_update ON public.tools;
DROP POLICY IF EXISTS tools_delete_admin ON public.tools;
CREATE POLICY tools_select ON public.tools FOR SELECT TO authenticated
  USING (shop_id IS NULL OR public.is_shop_member(shop_id));
CREATE POLICY tools_insert ON public.tools FOR INSERT TO authenticated
  WITH CHECK (shop_id IS NOT NULL AND public.is_shop_member(shop_id));
CREATE POLICY tools_update ON public.tools FOR UPDATE TO authenticated
  USING (public.is_shop_member(shop_id)) WITH CHECK (public.is_shop_member(shop_id));
CREATE POLICY tools_delete ON public.tools FOR DELETE TO authenticated
  USING (public.is_shop_owner(shop_id));

-- ========== INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_shops_owner ON public.shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shop_members_user ON public.shop_members(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_members_shop ON public.shop_members(shop_id);
CREATE INDEX IF NOT EXISTS idx_clients_shop ON public.clients(shop_id);
CREATE INDEX IF NOT EXISTS idx_clients_created ON public.clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_shop ON public.workshop_tickets(shop_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON public.workshop_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tools_shop ON public.tools(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_shop ON public.audit_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_wa_templates_shop ON public.whatsapp_templates(shop_id);

-- ========== TRIGGERS updated_at ==========
DROP TRIGGER IF EXISTS shops_set_updated_at ON public.shops;
CREATE TRIGGER shops_set_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS clients_set_updated_at ON public.clients;
CREATE TRIGGER clients_set_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS subscriptions_set_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== INSCRIPTION : profil + rôle + essai 7 jours ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_first THEN 'admin'::public.app_role ELSE 'technicien'::public.app_role END)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan, status, expires_at)
  VALUES (NEW.id, 'trial', 'active', now() + INTERVAL '7 days')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END; $$;