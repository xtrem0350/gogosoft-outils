CREATE TABLE IF NOT EXISTS workshop_tickets (
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
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE workshop_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view workshop tickets"
  ON workshop_tickets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert workshop tickets"
  ON workshop_tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update workshop tickets"
  ON workshop_tickets FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete workshop tickets"
  ON workshop_tickets FOR DELETE USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );
