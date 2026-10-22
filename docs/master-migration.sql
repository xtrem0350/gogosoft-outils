-- ============================================================
-- GOGOSOFT TOOLS MANAGER — MASTER MIGRATION SCRIPT
-- ============================================================
-- Ce script recrée TOUTE la base Supabase à partir de zéro.
-- Il est idempotent : peut être ré-exécuté sans casser l'existant.
--
-- Usage :
--   1. Créer un nouveau projet Supabase
--   2. Ouvrir le SQL Editor
--   3. Coller ce fichier EN ENTIER
--   4. Run
--   5. Copier les variables d'env (URL, anon key, project ID)
--   6. Dupliquer le frontend + configurer .env.local
--
-- Dernière mise à jour : 2026-10-21
-- Inclut : 18 migrations originales + 5 migrations v2 (workflow réparateur)
-- ============================================================


-- ============================================================
-- SECTION 1 : FONDATIONS (BLOC A — type app_role + fonctions)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin','technicien','lecteur');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role::text
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

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
  RETURN NEW;
END; $$;


-- ============================================================
-- SECTION 2 : TABLES DE BASE (BLOC B)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  version TEXT,
  chemin TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('exe','archive','dossier')),
  categorie TEXT NOT NULL CHECK (categorie IN ('MTK','Unisoc','Apple','Drivers','Autres')),
  sous_categorie TEXT,
  description TEXT,
  favori BOOLEAN NOT NULL DEFAULT FALSE,
  icone TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  launch_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tool_launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('open_folder','launch_exe','open_archive')),
  launched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tool_launches ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tool_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create','update','delete','restore')),
  changes JSONB,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tool_logs ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SECTION 3 : TRIGGERS (BLOC C)
-- ============================================================

DROP TRIGGER IF EXISTS tools_set_updated_at ON public.tools;
CREATE TRIGGER tools_set_updated_at BEFORE UPDATE ON public.tools
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- SECTION 4 : register_launch + REVOKE (fichier #2)
-- ============================================================

CREATE OR REPLACE FUNCTION public.register_launch(_tool_id UUID, _action TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.tool_launches (tool_id, user_id, action) VALUES (_tool_id, auth.uid(), _action);
  UPDATE public.tools SET launch_count = launch_count + 1, last_used_at = now() WHERE id = _tool_id;
END; $$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_launch(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_launch(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;


-- ============================================================
-- SECTION 5 : WORKSHOP_TICKETS (fichier #3)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workshop_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  device_model TEXT NOT NULL,
  device_processor TEXT,
  device_imei TEXT,
  device_sn TEXT,
  device_os_version TEXT,
  issues TEXT[] NOT NULL DEFAULT '{}',
  status TEXT CHECK (status IN ('en_attente','en_cours','termine')) DEFAULT 'en_attente',
  diagnosis JSONB,
  notes TEXT,
  notified_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workshop_tickets ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
ALTER TABLE public.workshop_tickets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workshop_tickets' AND policyname = 'workshop_select') THEN
    CREATE POLICY "workshop_select" ON public.workshop_tickets FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workshop_tickets' AND policyname = 'workshop_insert') THEN
    CREATE POLICY "workshop_insert" ON public.workshop_tickets FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workshop_tickets' AND policyname = 'workshop_update') THEN
    CREATE POLICY "workshop_update" ON public.workshop_tickets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS workshop_tickets_set_updated_at ON public.workshop_tickets;
CREATE TRIGGER workshop_tickets_set_updated_at BEFORE UPDATE ON public.workshop_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- SECTION 6 : SHOPS + SHOP_MEMBERS + HELPERS (BLOC 4.A/4.B/4.C + 5.A)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shop_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','technicien')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, user_id)
);
ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;

-- Helpers (nom de paramètre shop_uuid pour compatibilité)
CREATE OR REPLACE FUNCTION public.is_shop_member(shop_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = shop_uuid AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_shop_owner(shop_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shops WHERE id = shop_uuid AND owner_id = auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION public.is_shop_member(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_shop_owner(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_shop_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_shop_owner(UUID) TO authenticated;

-- Policies shops
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

-- Policies shop_members
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


-- ============================================================
-- SECTION 7 : CLIENTS + SUBSCRIPTIONS + PAYMENTS (BLOC 5.A)
-- ============================================================

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
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clients_all ON public.clients;
CREATE POLICY clients_all ON public.clients FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id)) WITH CHECK (public.is_shop_member(shop_id));

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
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS payments_insert ON public.payments;
CREATE POLICY payments_insert ON public.payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS payments_update ON public.payments;
CREATE POLICY payments_update ON public.payments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ============================================================
-- SECTION 8 : WHATSAPP TEMPLATES + AUDIT LOGS (BLOC 5.B)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
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
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_shop_owner(shop_id) OR user_id = auth.uid());
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_shop_member(shop_id));


-- ============================================================
-- SECTION 9 : ALTER workshop_tickets (multi-tenant) (BLOC 5.B)
-- ============================================================

ALTER TABLE public.workshop_tickets ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.workshop_tickets ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.workshop_tickets ADD COLUMN IF NOT EXISTS price_estimate INTEGER;
ALTER TABLE public.workshop_tickets ADD COLUMN IF NOT EXISTS price_final INTEGER;
ALTER TABLE public.workshop_tickets ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

DROP POLICY IF EXISTS workshop_select ON public.workshop_tickets;
DROP POLICY IF EXISTS workshop_insert ON public.workshop_tickets;
DROP POLICY IF EXISTS workshop_update ON public.workshop_tickets;
DROP POLICY IF EXISTS workshop_delete_admin ON public.workshop_tickets;
DROP POLICY IF EXISTS workshop_delete ON public.workshop_tickets;
CREATE POLICY workshop_select ON public.workshop_tickets FOR SELECT TO authenticated USING (public.is_shop_member(shop_id));
CREATE POLICY workshop_insert ON public.workshop_tickets FOR INSERT TO authenticated WITH CHECK (public.is_shop_member(shop_id));
CREATE POLICY workshop_update ON public.workshop_tickets FOR UPDATE TO authenticated USING (public.is_shop_member(shop_id)) WITH CHECK (public.is_shop_member(shop_id));
CREATE POLICY workshop_delete ON public.workshop_tickets FOR DELETE TO authenticated USING (public.is_shop_owner(shop_id));

ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS tools_select ON public.tools;
DROP POLICY IF EXISTS tools_insert ON public.tools;
DROP POLICY IF EXISTS tools_update ON public.tools;
DROP POLICY IF EXISTS tools_delete_admin ON public.tools;
DROP POLICY IF EXISTS tools_delete ON public.tools;
CREATE POLICY tools_select ON public.tools FOR SELECT TO authenticated
  USING (shop_id IS NULL OR public.is_shop_member(shop_id));
CREATE POLICY tools_insert ON public.tools FOR INSERT TO authenticated
  WITH CHECK (shop_id IS NOT NULL AND public.is_shop_member(shop_id));
CREATE POLICY tools_update ON public.tools FOR UPDATE TO authenticated
  USING (public.is_shop_member(shop_id)) WITH CHECK (public.is_shop_member(shop_id));
CREATE POLICY tools_delete ON public.tools FOR DELETE TO authenticated
  USING (public.is_shop_owner(shop_id));


-- ============================================================
-- SECTION 10 : INDEX (BLOC 5.B)
-- ============================================================

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


-- ============================================================
-- SECTION 11 : TRIGGERS updated_at (BLOC 5.B)
-- ============================================================

DROP TRIGGER IF EXISTS shops_set_updated_at ON public.shops;
CREATE TRIGGER shops_set_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS clients_set_updated_at ON public.clients;
CREATE TRIGGER clients_set_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS subscriptions_set_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- SECTION 12 : handle_new_user enrichi (BLOC 5.B)
-- ============================================================

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


-- ============================================================
-- SECTION 13 : WHATSAPP + AUDIT (fichier #6)
-- ============================================================

DROP POLICY IF EXISTS "Members manage templates" ON public.whatsapp_templates;
CREATE POLICY "Members manage templates" ON public.whatsapp_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = whatsapp_templates.shop_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = audit_logs.shop_id AND user_id = auth.uid() AND role = 'owner'));

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_shop ON public.whatsapp_templates(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_shop ON public.audit_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);


-- ============================================================
-- SECTION 14 : PSEUDO + IDENTIFIANT (fichier #7)
-- ============================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS pseudo TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT '+225';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_pseudo_unique') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_pseudo_unique UNIQUE (pseudo);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_phone_unique') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_pseudo ON profiles(pseudo);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

CREATE OR REPLACE FUNCTION get_email_by_identifier(identifier TEXT)
RETURNS TEXT AS $$
DECLARE found_email TEXT;
BEGIN
  IF identifier LIKE '%@%' THEN
    SELECT email INTO found_email FROM auth.users WHERE LOWER(email) = LOWER(identifier) LIMIT 1;
    RETURN found_email;
  END IF;
  IF identifier ~ '^[a-zA-Z]' THEN
    SELECT u.email INTO found_email FROM auth.users u JOIN profiles p ON p.id = u.id
    WHERE LOWER(p.pseudo) = LOWER(identifier) LIMIT 1;
    RETURN found_email;
  END IF;
  SELECT u.email INTO found_email FROM auth.users u JOIN profiles p ON p.id = u.id
  WHERE REGEXP_REPLACE(p.phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(identifier, '[^0-9]', '', 'g') LIMIT 1;
  RETURN found_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_email_by_identifier(TEXT) TO anon, authenticated;


-- ============================================================
-- SECTION 15 : ÉVÉNEMENTS + GUIDES (fichier #8)
-- ============================================================

ALTER TABLE public.workshop_tickets
  ADD COLUMN IF NOT EXISTS entry_fee INTEGER DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS entry_fee_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS diagnostic_notes TEXT;

CREATE TABLE IF NOT EXISTS public.workshop_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.workshop_tickets(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('received','diagnosed','in_progress','waiting_parts','completed','delivered','cancelled','note')) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.workshop_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view events" ON public.workshop_events;
CREATE POLICY "Members view events" ON public.workshop_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workshop_tickets wt JOIN public.shop_members sm ON sm.shop_id = wt.shop_id WHERE wt.id = workshop_events.ticket_id AND sm.user_id = auth.uid()));
DROP POLICY IF EXISTS "Members insert events" ON public.workshop_events;
CREATE POLICY "Members insert events" ON public.workshop_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.workshop_tickets wt JOIN public.shop_members sm ON sm.shop_id = wt.shop_id WHERE wt.id = workshop_events.ticket_id AND sm.user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_workshop_events_ticket ON public.workshop_events(ticket_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.repair_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  processor TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard','expert')),
  estimated_time INTEGER,
  actual_time INTEGER,
  tools_needed TEXT[],
  steps JSONB,
  images TEXT[],
  external_links JSONB,
  personal_notes TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.repair_guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authors manage their guides" ON public.repair_guides;
CREATE POLICY "Authors manage their guides" ON public.repair_guides FOR ALL TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "Anyone can view public guides" ON public.repair_guides;
CREATE POLICY "Anyone can view public guides" ON public.repair_guides FOR SELECT TO authenticated
  USING (is_public = true);
CREATE INDEX IF NOT EXISTS idx_repair_guides_device ON public.repair_guides(brand, device_model);
CREATE INDEX IF NOT EXISTS idx_repair_guides_author ON public.repair_guides(author_id);
CREATE INDEX IF NOT EXISTS idx_repair_guides_public ON public.repair_guides(is_public);
DROP TRIGGER IF EXISTS repair_guides_set_updated_at ON public.repair_guides;
CREATE TRIGGER repair_guides_set_updated_at BEFORE UPDATE ON public.repair_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- SECTION 16 : SUPER ADMIN (fichier #9)
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin ON public.profiles(is_super_admin) WHERE is_super_admin = true;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true);
END; $$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

DROP POLICY IF EXISTS "Super admin view all profiles" ON public.profiles;
CREATE POLICY "Super admin view all profiles" ON public.profiles FOR SELECT USING (public.is_super_admin());
DROP POLICY IF EXISTS "Super admin view all shops" ON public.shops;
CREATE POLICY "Super admin view all shops" ON public.shops FOR SELECT USING (public.is_super_admin());
DROP POLICY IF EXISTS "Super admin view all shop members" ON public.shop_members;
CREATE POLICY "Super admin view all shop members" ON public.shop_members FOR SELECT USING (public.is_super_admin());
DROP POLICY IF EXISTS "Super admin view all subscriptions" ON public.subscriptions;
CREATE POLICY "Super admin view all subscriptions" ON public.subscriptions FOR SELECT USING (public.is_super_admin());
DROP POLICY IF EXISTS "Super admin view all payments" ON public.payments;
CREATE POLICY "Super admin view all payments" ON public.payments FOR SELECT USING (public.is_super_admin());
DROP POLICY IF EXISTS "Super admin view all clients" ON public.clients;
CREATE POLICY "Super admin view all clients" ON public.clients FOR SELECT USING (public.is_super_admin());
DROP POLICY IF EXISTS "Super admin view all workshop tickets" ON public.workshop_tickets;
CREATE POLICY "Super admin view all workshop tickets" ON public.workshop_tickets FOR SELECT USING (public.is_super_admin());


-- ============================================================
-- SECTION 17 : FIX USER_ROLES RLS (fichier #10)
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_role(role_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = role_name);
END; $$;

GRANT EXECUTE ON FUNCTION public.user_has_role(TEXT) TO authenticated;

DROP POLICY IF EXISTS "Users view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;
CREATE POLICY "Users view their own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own roles" ON public.user_roles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.user_has_role('admin'));


-- ============================================================
-- SECTION 18 : WORKSHOP TYPE (fichier #11)
-- ============================================================

ALTER TABLE public.workshop_tickets
ADD COLUMN IF NOT EXISTS activity_type TEXT CHECK (activity_type IN ('phone','computer','consumable')) DEFAULT 'phone';
ALTER TABLE public.workshop_tickets ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS idx_workshop_tickets_activity ON public.workshop_tickets(shop_id, activity_type);
ALTER TABLE public.tools
ADD COLUMN IF NOT EXISTS activity_type TEXT CHECK (activity_type IN ('phone','computer','consumable')) DEFAULT 'phone';


-- ============================================================
-- SECTION 19 : SALES + STORAGE (fichier #12)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('phone','computer','consumable')) NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_photo_url TEXT,
  characteristics JSONB,
  quantity INTEGER DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending','paid','refunded')) DEFAULT 'pending',
  payment_method TEXT CHECK (payment_method IN ('cash','wave','orange_money','mtn','moov')),
  delivery_status TEXT CHECK (delivery_status IN ('pending','ready','delivered')) DEFAULT 'pending',
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT,
  client_whatsapp TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view shop sales" ON public.sales;
CREATE POLICY "Members view shop sales" ON public.sales FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = sales.shop_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Members manage shop sales" ON public.sales;
CREATE POLICY "Members manage shop sales" ON public.sales FOR ALL
  USING (EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = sales.shop_id AND user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_sales_shop ON public.sales(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_activity ON public.sales(shop_id, activity_type);

INSERT INTO storage.buckets (id, name, public) VALUES ('sales-product-photos', 'sales-product-photos', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Shop members upload sale photos" ON storage.objects;
CREATE POLICY "Shop members upload sale photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sales-product-photos' AND EXISTS (
    SELECT 1 FROM public.shop_members WHERE shop_members.shop_id::text = split_part(storage.objects.name, '/', 1) AND shop_members.user_id = auth.uid()
  ));


-- ============================================================
-- SECTION 20 : PRICING DOMAIN (fichier #13)
-- ============================================================

ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS domain_requested TEXT,
ADD COLUMN IF NOT EXISTS domain_status TEXT CHECK (domain_status IN ('none', 'pending', 'active', 'transferred')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS domain_purchased_at TIMESTAMPTZ;

ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS domain_included BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS domain_name TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS device_imei TEXT,
ADD COLUMN IF NOT EXISTS device_os TEXT,
ADD COLUMN IF NOT EXISTS device_build TEXT,
ADD COLUMN IF NOT EXISTS first_trial_used_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_device_imei ON public.profiles(device_imei);


-- ============================================================
-- SECTION 21 : ACTIVITY MODULES (fichier #14) — SANS pricing_config
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.activity_modules ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.activity_modules TO anon, authenticated;
GRANT ALL ON public.activity_modules TO service_role;
DROP POLICY IF EXISTS "Anyone can read active modules" ON public.activity_modules;
CREATE POLICY "Anyone can read active modules" ON public.activity_modules FOR SELECT TO anon, authenticated USING (is_active = true);

INSERT INTO public.activity_modules (code, label, icon, description) VALUES
  ('phone_repair', 'Réparation téléphones', 'Smartphone', 'Gérer les fiches de réparation mobile'),
  ('computer_repair', 'Réparation ordinateurs', 'Laptop', 'Gérer les fiches de maintenance PC'),
  ('phone_sale', 'Vente de téléphones', 'ShoppingCart', 'Vendre des téléphones neufs ou d''occasion'),
  ('computer_sale', 'Vente ordinateurs', 'Monitor', 'Vendre des PC, laptops, accessoires'),
  ('consumable', 'Consommables', 'Package', 'Gérer le stock de pièces et accessoires')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.shop_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL REFERENCES public.activity_modules(code) ON DELETE CASCADE,
  enabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, module_code)
);
CREATE INDEX IF NOT EXISTS idx_shop_modules_shop ON public.shop_modules(shop_id);
ALTER TABLE public.shop_modules ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_modules TO authenticated;
GRANT ALL ON public.shop_modules TO service_role;
DROP POLICY IF EXISTS "Members view shop modules" ON public.shop_modules;
CREATE POLICY "Members view shop modules" ON public.shop_modules FOR SELECT TO authenticated USING (public.is_shop_member(shop_id));
DROP POLICY IF EXISTS "Owners manage shop modules" ON public.shop_modules;
CREATE POLICY "Owners manage shop modules" ON public.shop_modules FOR ALL TO authenticated USING (public.is_shop_owner(shop_id)) WITH CHECK (public.is_shop_owner(shop_id));

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS selected_modules TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS price_fcfa INTEGER NOT NULL DEFAULT 0;


-- ============================================================
-- SECTION 22 : COMPLÉMENT MODULES (fichier #15) — SANS pricing_config
-- ============================================================

-- (Les tables existent déjà, on ne réinsère que les modules vitrine, faits en Section 26)

-- ============================================================
-- SECTION 23 : BACKFILL SHOP_MODULES (fichier #16)
-- ============================================================

INSERT INTO public.shop_modules (shop_id, module_code)
SELECT shops.id, modules.code
FROM public.shops AS shops
CROSS JOIN public.activity_modules AS modules
WHERE NOT EXISTS (
  SELECT 1 FROM public.shop_modules AS existing
  WHERE existing.shop_id = shops.id AND existing.module_code = modules.code
)
ON CONFLICT (shop_id, module_code) DO NOTHING;

UPDATE public.subscriptions AS subscription
SET selected_modules = ARRAY(
  SELECT shop_module.module_code FROM public.shop_modules AS shop_module
  WHERE shop_module.shop_id IN (SELECT shop.id FROM public.shops AS shop WHERE shop.owner_id = subscription.user_id)
)
WHERE subscription.selected_modules = '{}' OR subscription.selected_modules IS NULL;


-- ============================================================
-- SECTION 24 : ADMIN PLATFORM (fichier #17)
-- ============================================================

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

ALTER TABLE public.platform_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage activity modules" ON public.activity_modules;
CREATE POLICY "Super admins manage activity modules" ON public.activity_modules FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins manage shop modules" ON public.shop_modules;
CREATE POLICY "Super admins manage shop modules" ON public.shop_modules FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins insert audit logs" ON public.audit_logs;
CREATE POLICY "Super admins insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins read audit logs" ON public.audit_logs;
CREATE POLICY "Super admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Authenticated users read platform notifications" ON public.platform_notifications;
CREATE POLICY "Authenticated users read platform notifications" ON public.platform_notifications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Super admins send platform notifications" ON public.platform_notifications;
CREATE POLICY "Super admins send platform notifications" ON public.platform_notifications FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Users create own support tickets" ON public.platform_support_tickets;
CREATE POLICY "Users create own support tickets" ON public.platform_support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users and super admins read support tickets" ON public.platform_support_tickets;
CREATE POLICY "Users and super admins read support tickets" ON public.platform_support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins update support tickets" ON public.platform_support_tickets;
CREATE POLICY "Super admins update support tickets" ON public.platform_support_tickets FOR UPDATE TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());


-- ============================================================
-- SECTION 25 : VITRINE + PRICING FINAL (fichier #18)
-- ============================================================

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS is_online_shop BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shop_slug TEXT,
  ADD COLUMN IF NOT EXISTS shop_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS shop_description TEXT,
  ADD COLUMN IF NOT EXISTS shop_banner_url TEXT,
  ADD COLUMN IF NOT EXISTS shop_phone TEXT,
  ADD COLUMN IF NOT EXISTS shop_address TEXT,
  ADD COLUMN IF NOT EXISTS shop_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS accepts_wave BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_orange_money BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_mtn BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_moov BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_cash_on_pickup BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_cash_on_delivery BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_fee INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_slug ON public.shops(shop_slug) WHERE shop_slug IS NOT NULL;

INSERT INTO storage.buckets (id, name, public) VALUES ('shop-assets', 'shop-assets', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Shop members upload shop assets" ON storage.objects;
CREATE POLICY "Shop members upload shop assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-assets' AND public.is_shop_member((storage.foldername(name))[1]::uuid));
DROP POLICY IF EXISTS "Shop members update shop assets" ON storage.objects;
CREATE POLICY "Shop members update shop assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'shop-assets' AND public.is_shop_member((storage.foldername(name))[1]::uuid))
  WITH CHECK (bucket_id = 'shop-assets' AND public.is_shop_member((storage.foldername(name))[1]::uuid));
DROP POLICY IF EXISTS "Shop members delete shop assets" ON storage.objects;
CREATE POLICY "Shop members delete shop assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'shop-assets' AND public.is_shop_member((storage.foldername(name))[1]::uuid));

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'phone' CHECK (category IN ('phone','computer','accessory','consumable','other')),
  price INTEGER NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  characteristics JSONB NOT NULL DEFAULT '{}',
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_shop ON public.products(shop_id, is_available);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
DROP POLICY IF EXISTS "Members manage products" ON public.products;
DROP POLICY IF EXISTS "Owners manage products" ON public.products;
CREATE POLICY "Owners manage products" ON public.products FOR ALL TO authenticated
  USING (public.is_shop_owner(shop_id)) WITH CHECK (public.is_shop_owner(shop_id));
DROP POLICY IF EXISTS "Public read available products" ON public.products;
CREATE POLICY "Public read available products" ON public.products FOR SELECT TO anon, authenticated
  USING (is_available = true AND EXISTS (SELECT 1 FROM public.shops WHERE shops.id = products.shop_id AND shops.is_online_shop = true));

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  tracking_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  client_address TEXT,
  client_notes TEXT,
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  delivery_fee INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total INTEGER NOT NULL CHECK (total >= subtotal),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('wave','orange_money','mtn','moov','cash_on_delivery','cash_on_pickup')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded','failed')),
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending','confirmed','preparing','ready','delivering','delivered','cancelled')),
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_shop ON public.orders(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(shop_id, delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
DROP POLICY IF EXISTS "Members manage orders" ON public.orders;
DROP POLICY IF EXISTS "Members view orders" ON public.orders;
CREATE POLICY "Members view orders" ON public.orders FOR SELECT TO authenticated USING (public.is_shop_member(shop_id));
DROP POLICY IF EXISTS "Owners manage orders" ON public.orders;
CREATE POLICY "Owners manage orders" ON public.orders FOR ALL TO authenticated
  USING (public.is_shop_owner(shop_id)) WITH CHECK (public.is_shop_owner(shop_id));

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  total INTEGER NOT NULL CHECK (total >= 0)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
DROP POLICY IF EXISTS "Members manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Members view order items" ON public.order_items;
CREATE POLICY "Members view order items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND public.is_shop_member(o.shop_id)));
DROP POLICY IF EXISTS "Owners manage order items" ON public.order_items;
CREATE POLICY "Owners manage order items" ON public.order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND public.is_shop_owner(o.shop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND public.is_shop_owner(o.shop_id)));

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- SECTION 26 : FONCTIONS PUBLIQUES VITRINE (fichier #18)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_public_shop_by_slug(p_slug TEXT)
RETURNS TABLE (id UUID, name TEXT, shop_slug TEXT, shop_logo_url TEXT, shop_description TEXT, shop_banner_url TEXT, shop_phone TEXT, shop_address TEXT, shop_whatsapp TEXT, accepts_wave BOOLEAN, accepts_orange_money BOOLEAN, accepts_mtn BOOLEAN, accepts_moov BOOLEAN, accepts_cash_on_pickup BOOLEAN, accepts_cash_on_delivery BOOLEAN, delivery_fee INTEGER, delivery_available BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT s.id, s.name, s.shop_slug, s.shop_logo_url, s.shop_description, s.shop_banner_url, s.shop_phone, s.shop_address, s.shop_whatsapp, s.accepts_wave, s.accepts_orange_money, s.accepts_mtn, s.accepts_moov, s.accepts_cash_on_pickup, s.accepts_cash_on_delivery, s.delivery_fee, s.delivery_available
  FROM public.shops s WHERE s.shop_slug = p_slug AND s.is_online_shop = true LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_shop_by_slug(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_shop_by_slug(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_public_order(p_shop_id UUID, p_client_name TEXT, p_client_whatsapp TEXT, p_client_address TEXT, p_client_notes TEXT, p_payment_method TEXT, p_delivery BOOLEAN, p_items JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE shop_row public.shops%ROWTYPE; input_item JSONB; product_row public.products%ROWTYPE; item_quantity INTEGER; item_total INTEGER; subtotal_amount INTEGER := 0; delivery_amount INTEGER := 0; line_snapshots JSONB := '[]'::JSONB; count_today INTEGER; generated_number TEXT; new_order public.orders%ROWTYPE; item_count INTEGER;
BEGIN
  IF length(trim(coalesce(p_client_name, ''))) < 2 OR length(trim(coalesce(p_client_whatsapp, ''))) < 8 THEN RAISE EXCEPTION 'Nom et numéro WhatsApp valides requis.'; END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN RAISE EXCEPTION 'Le panier est invalide.'; END IF;
  item_count := jsonb_array_length(p_items);
  IF item_count < 1 OR item_count > 50 THEN RAISE EXCEPTION 'Le panier doit contenir entre 1 et 50 lignes.'; END IF;
  SELECT * INTO shop_row FROM public.shops WHERE id = p_shop_id AND is_online_shop = true FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cette boutique en ligne est indisponible.'; END IF;
  IF p_delivery AND NOT shop_row.delivery_available THEN RAISE EXCEPTION 'La livraison n''est pas disponible.'; END IF;
  IF p_delivery AND length(trim(coalesce(p_client_address, ''))) < 4 THEN RAISE EXCEPTION 'Une adresse est requise pour la livraison.'; END IF;
  IF NOT ((p_payment_method = 'wave' AND shop_row.accepts_wave) OR (p_payment_method = 'orange_money' AND shop_row.accepts_orange_money) OR (p_payment_method = 'mtn' AND shop_row.accepts_mtn) OR (p_payment_method = 'moov' AND shop_row.accepts_moov) OR (p_payment_method = 'cash_on_pickup' AND shop_row.accepts_cash_on_pickup AND NOT p_delivery) OR (p_payment_method = 'cash_on_delivery' AND shop_row.accepts_cash_on_delivery AND p_delivery)) THEN RAISE EXCEPTION 'Ce moyen de paiement n''est pas accepté.'; END IF;
  delivery_amount := CASE WHEN p_delivery THEN shop_row.delivery_fee ELSE 0 END;
  FOR input_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    item_quantity := (input_item->>'quantity')::INTEGER;
    IF item_quantity < 1 OR item_quantity > 99 THEN RAISE EXCEPTION 'La quantité doit être comprise entre 1 et 99.'; END IF;
    SELECT * INTO product_row FROM public.products WHERE id = (input_item->>'product_id')::UUID AND shop_id = p_shop_id AND is_available = true FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Un produit du panier n''est plus disponible.'; END IF;
    IF product_row.stock < item_quantity THEN RAISE EXCEPTION 'Stock insuffisant pour : %.', product_row.name; END IF;
    UPDATE public.products SET stock = stock - item_quantity WHERE id = product_row.id;
    item_total := product_row.price * item_quantity;
    subtotal_amount := subtotal_amount + item_total;
    input_item := jsonb_build_object('product_id', product_row.id, 'product_name', product_row.name, 'product_image_url', product_row.image_urls[1], 'quantity', item_quantity, 'unit_price', product_row.price, 'total', item_total);
    line_snapshots := line_snapshots || jsonb_build_array(input_item);
  END LOOP;
  PERFORM pg_advisory_xact_lock(hashtext(p_shop_id::TEXT));
  SELECT COUNT(*) INTO count_today FROM public.orders WHERE shop_id = p_shop_id AND created_at::DATE = CURRENT_DATE;
  generated_number := 'CMD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || REPLACE(p_shop_id::TEXT, '-', '') || '-' || LPAD((count_today + 1)::TEXT, 4, '0');
  INSERT INTO public.orders (shop_id, order_number, client_name, client_whatsapp, client_address, client_notes, subtotal, delivery_fee, total, payment_method) VALUES (p_shop_id, generated_number, trim(p_client_name), trim(p_client_whatsapp), NULLIF(trim(coalesce(p_client_address, '')), ''), NULLIF(trim(coalesce(p_client_notes, '')), ''), subtotal_amount, delivery_amount, subtotal_amount + delivery_amount, p_payment_method) RETURNING * INTO new_order;
  INSERT INTO public.order_items (order_id, product_id, product_name, product_image_url, quantity, unit_price, total) SELECT new_order.id, (item->>'product_id')::UUID, item->>'product_name', item->>'product_image_url', (item->>'quantity')::INTEGER, (item->>'unit_price')::INTEGER, (item->>'total')::INTEGER FROM jsonb_array_elements(line_snapshots) AS item;
  RETURN jsonb_build_object('id', new_order.id, 'order_number', new_order.order_number, 'tracking_token', new_order.tracking_token, 'subtotal', new_order.subtotal, 'delivery_fee', new_order.delivery_fee, 'total', new_order.total);
END; $$;
REVOKE ALL ON FUNCTION public.create_public_order(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_order(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_order(p_order_id UUID, p_tracking_token UUID)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('id', o.id, 'order_number', o.order_number, 'client_name', o.client_name, 'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee, 'total', o.total, 'payment_method', o.payment_method, 'payment_status', o.payment_status, 'delivery_status', o.delivery_status, 'created_at', o.created_at, 'items', COALESCE((SELECT jsonb_agg(jsonb_build_object('product_name', oi.product_name, 'product_image_url', oi.product_image_url, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total', oi.total)) FROM public.order_items oi WHERE oi.order_id = o.id), '[]'::JSONB), 'shop', jsonb_build_object('name', s.name, 'shop_phone', s.shop_phone, 'shop_whatsapp', s.shop_whatsapp, 'shop_slug', s.shop_slug))
  FROM public.orders o JOIN public.shops s ON s.id = o.shop_id WHERE o.id = p_order_id AND o.tracking_token = p_tracking_token AND s.is_online_shop = true;
$$;
REVOKE ALL ON FUNCTION public.get_public_order(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order(UUID, UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_shop_order(p_order_id UUID, p_delivery_status TEXT, p_payment_status TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE order_row public.orders%ROWTYPE; order_item public.order_items%ROWTYPE;
BEGIN
  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR NOT public.is_shop_owner(order_row.shop_id) THEN RAISE EXCEPTION 'Commande introuvable ou accès refusé.'; END IF;
  IF order_row.delivery_status = 'cancelled' AND p_delivery_status <> 'cancelled' THEN RAISE EXCEPTION 'Une commande annulée ne peut pas être réouverte.'; END IF;
  IF p_delivery_status NOT IN ('pending','confirmed','preparing','ready','delivering','delivered','cancelled') OR p_payment_status NOT IN ('pending','paid','refunded','failed') THEN RAISE EXCEPTION 'Statut de commande invalide.'; END IF;
  IF p_delivery_status = 'cancelled' AND order_row.delivery_status <> 'cancelled' THEN
    FOR order_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
      IF order_item.product_id IS NOT NULL THEN UPDATE public.products SET stock = stock + order_item.quantity WHERE id = order_item.product_id AND shop_id = order_row.shop_id; END IF;
    END LOOP;
  END IF;
  UPDATE public.orders SET delivery_status = p_delivery_status, payment_status = p_payment_status WHERE id = p_order_id;
END; $$;
REVOKE ALL ON FUNCTION public.update_shop_order(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_shop_order(UUID, TEXT, TEXT) TO authenticated;


-- ============================================================
-- SECTION 27 : MODULES VITRINE + PRICING_CONFIG FINAL (fichier #18)
-- ============================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS storefront_modules TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS domain_included BOOLEAN NOT NULL DEFAULT false;

INSERT INTO public.activity_modules (code, label, icon, description) VALUES
  ('shop_phone', 'Vitrine téléphone', 'Smartphone', 'Présenter et vendre des téléphones en ligne'),
  ('shop_computer', 'Vitrine ordinateur', 'Laptop', 'Présenter et vendre des ordinateurs en ligne')
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, icon = EXCLUDED.icon, description = EXCLUDED.description, is_active = true;

CREATE TABLE IF NOT EXISTS public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code TEXT UNIQUE NOT NULL,
  plan_label TEXT NOT NULL,
  min_modules INTEGER NOT NULL,
  max_modules INTEGER NOT NULL,
  monthly_price_fcfa INTEGER NOT NULL,
  annual_price_fcfa INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (min_modules > 0 AND max_modules >= min_modules),
  CHECK (monthly_price_fcfa >= 0 AND annual_price_fcfa >= 0)
);
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.pricing_config TO anon, authenticated;
GRANT ALL ON public.pricing_config TO service_role;
DROP POLICY IF EXISTS "Anyone can read pricing" ON public.pricing_config;
CREATE POLICY "Anyone can read pricing" ON public.pricing_config FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Super admins manage pricing" ON public.pricing_config;
CREATE POLICY "Super admins manage pricing" ON public.pricing_config FOR UPDATE TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- UPSERT (au lieu de DELETE + INSERT) pour idempotence
INSERT INTO public.pricing_config (plan_code, plan_label, min_modules, max_modules, monthly_price_fcfa, annual_price_fcfa) VALUES
  ('app_1', 'Application - 1 module', 1, 1, 6000, 60000),
  ('app_2', 'Application - 2 modules', 2, 2, 10000, 100000),
  ('app_all', 'Application - Tous modules', 3, 5, 15000, 150000),
  ('shop_1', 'Vitrine - 1 activité', 1, 1, 20000, 200000),
  ('shop_2', 'Vitrine - 2 activités', 2, 2, 30000, 300000)
ON CONFLICT (plan_code) DO UPDATE SET
  plan_label = EXCLUDED.plan_label,
  min_modules = EXCLUDED.min_modules,
  max_modules = EXCLUDED.max_modules,
  monthly_price_fcfa = EXCLUDED.monthly_price_fcfa,
  annual_price_fcfa = EXCLUDED.annual_price_fcfa,
  is_active = true,
  updated_at = NOW();


-- ============================================================
-- SECTION 28 : MIGRATION V2.1 — storage_locations (workflow réparateur)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'carton' CHECK (location_type IN ('carton', 'shelf', 'drawer', 'bag', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  current_ticket_id UUID REFERENCES public.workshop_tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_storage_locations_shop ON public.storage_locations(shop_id);
CREATE INDEX IF NOT EXISTS idx_storage_locations_status ON public.storage_locations(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_storage_locations_ticket ON public.storage_locations(current_ticket_id);
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view storage locations" ON public.storage_locations;
CREATE POLICY "Members view storage locations" ON public.storage_locations FOR SELECT TO authenticated USING (public.is_shop_member(shop_id));
DROP POLICY IF EXISTS "Owners manage storage locations" ON public.storage_locations;
CREATE POLICY "Owners manage storage locations" ON public.storage_locations FOR ALL TO authenticated USING (public.is_shop_owner(shop_id)) WITH CHECK (public.is_shop_owner(shop_id));
DROP TRIGGER IF EXISTS storage_locations_set_updated_at ON public.storage_locations;
CREATE TRIGGER storage_locations_set_updated_at BEFORE UPDATE ON public.storage_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- SECTION 29 : MIGRATION V2.2 — élargir statut workshop_tickets
-- ============================================================

ALTER TABLE public.workshop_tickets DROP CONSTRAINT IF EXISTS workshop_tickets_status_check;
ALTER TABLE public.workshop_tickets ADD CONSTRAINT workshop_tickets_status_check
  CHECK (status IN ('en_attente', 'diagnostique', 'en_cours', 'termine', 'livre', 'annule'));


-- ============================================================
-- SECTION 30 : MIGRATION V2.3 — colonnes manquantes workshop_tickets
-- ============================================================

ALTER TABLE public.workshop_tickets
  ADD COLUMN IF NOT EXISTS ticket_number TEXT,
  ADD COLUMN IF NOT EXISTS device_brand TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS entry_fee_method TEXT,
  ADD COLUMN IF NOT EXISTS technicien_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS outils_utilises TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pieces_consommees JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS price_final_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_workshop_tickets_number ON public.workshop_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_workshop_tickets_technicien ON public.workshop_tickets(technicien_id);


-- ============================================================
-- SECTION 31 : MIGRATION V2.4 — workshop_payments (caisse atelier)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workshop_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.workshop_tickets(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('cash', 'wave', 'orange_money', 'mtn', 'moov')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('entry', 'final', 'partial')),
  received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workshop_payments_shop ON public.workshop_payments(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workshop_payments_ticket ON public.workshop_payments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_workshop_payments_date ON public.workshop_payments(created_at DESC);
ALTER TABLE public.workshop_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view workshop payments" ON public.workshop_payments;
CREATE POLICY "Members view workshop payments" ON public.workshop_payments FOR SELECT TO authenticated USING (public.is_shop_member(shop_id));
DROP POLICY IF EXISTS "Members insert workshop payments" ON public.workshop_payments;
CREATE POLICY "Members insert workshop payments" ON public.workshop_payments FOR INSERT TO authenticated WITH CHECK (public.is_shop_member(shop_id));
DROP POLICY IF EXISTS "Owners manage workshop payments" ON public.workshop_payments;
CREATE POLICY "Owners manage workshop payments" ON public.workshop_payments FOR ALL TO authenticated USING (public.is_shop_owner(shop_id)) WITH CHECK (public.is_shop_owner(shop_id));


-- ============================================================
-- SECTION 32 : MIGRATION V2.5 — ticket_number_sequences
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ticket_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_number INTEGER NOT NULL DEFAULT 0,
  UNIQUE (shop_id, date)
);
ALTER TABLE public.ticket_number_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members manage sequences" ON public.ticket_number_sequences;
CREATE POLICY "Members manage sequences" ON public.ticket_number_sequences FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id)) WITH CHECK (public.is_shop_member(shop_id));


-- ============================================================
-- FIN DU MASTER SCRIPT
-- ============================================================
-- Vérification finale :
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- Doit lister : activity_modules, audit_logs, clients, order_items, orders, payments,
-- platform_notifications, platform_support_tickets, pricing_config, products, profiles,
-- repair_guides, sales, shop_members, shop_modules, shops, storage_locations, subscriptions,
-- ticket_number_sequences, tool_launches, tool_logs, tools, user_roles, whatsapp_templates,
-- workshop_events, workshop_payments, workshop_tickets.
-- ============================================================