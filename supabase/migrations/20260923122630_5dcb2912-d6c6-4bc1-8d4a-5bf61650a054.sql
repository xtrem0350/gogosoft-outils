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

GRANT SELECT, INSERT ON public.workshop_events TO authenticated;
GRANT ALL ON public.workshop_events TO service_role;

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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_guides TO authenticated;
GRANT ALL ON public.repair_guides TO service_role;

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