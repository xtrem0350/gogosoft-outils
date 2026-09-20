
CREATE TYPE public.app_role AS ENUM ('admin','technicien','lecteur');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  theme TEXT NOT NULL DEFAULT 'dark',
  favorite_categories TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

CREATE TABLE public.tools (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tools TO authenticated;
GRANT ALL ON public.tools TO service_role;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tools_select" ON public.tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "tools_insert" ON public.tools FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'technicien'::public.app_role));
CREATE POLICY "tools_update" ON public.tools FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'technicien'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'technicien'::public.app_role));
CREATE POLICY "tools_delete_admin" ON public.tools FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role));

CREATE TABLE public.tool_launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('open_folder','launch_exe','open_archive')),
  launched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.tool_launches TO authenticated;
GRANT ALL ON public.tool_launches TO service_role;
ALTER TABLE public.tool_launches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "launches_insert_own" ON public.tool_launches FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "launches_select_own_or_admin" ON public.tool_launches FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role));

CREATE TABLE public.tool_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create','update','delete','restore')),
  changes JSONB,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.tool_logs TO authenticated;
GRANT ALL ON public.tool_logs TO service_role;
ALTER TABLE public.tool_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_insert_own" ON public.tool_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "logs_select_own_or_admin" ON public.tool_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER tools_set_updated_at BEFORE UPDATE ON public.tools
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.register_launch(_tool_id UUID, _action TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.tool_launches (tool_id, user_id, action) VALUES (_tool_id, auth.uid(), _action);
  UPDATE public.tools SET launch_count = launch_count + 1, last_used_at = now() WHERE id = _tool_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.register_launch(UUID, TEXT) TO authenticated;

CREATE INDEX tools_categorie_idx ON public.tools (categorie);
CREATE INDEX launches_tool_idx ON public.tool_launches (tool_id, launched_at DESC);
