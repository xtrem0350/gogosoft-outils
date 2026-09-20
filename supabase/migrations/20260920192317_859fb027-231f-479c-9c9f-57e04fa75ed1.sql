CREATE TABLE public.workshop_tickets (
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
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_tickets TO authenticated;
GRANT ALL ON public.workshop_tickets TO service_role;
ALTER TABLE public.workshop_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workshop_select" ON public.workshop_tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "workshop_insert" ON public.workshop_tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "workshop_update" ON public.workshop_tickets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "workshop_delete_admin" ON public.workshop_tickets FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER workshop_tickets_set_updated_at BEFORE UPDATE ON public.workshop_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();