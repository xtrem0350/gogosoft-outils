-- Table whatsapp_templates (messages pré-remplis pour wa.me)
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage templates" ON whatsapp_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM shop_members WHERE shop_id = whatsapp_templates.shop_id AND user_id = auth.uid()));

-- Table audit_logs (traçabilité multi-tenant)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit logs" ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM shop_members WHERE shop_id = audit_logs.shop_id AND user_id = auth.uid() AND role = 'owner'));

-- Index
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_shop ON whatsapp_templates(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_shop ON audit_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
