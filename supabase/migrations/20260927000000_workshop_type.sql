ALTER TABLE public.workshop_tickets
ADD COLUMN IF NOT EXISTS activity_type TEXT
  CHECK (activity_type IN ('phone','computer','consumable'))
  DEFAULT 'phone';

ALTER TABLE public.workshop_tickets
ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS idx_workshop_tickets_activity
  ON public.workshop_tickets(shop_id, activity_type);

ALTER TABLE public.tools
ADD COLUMN IF NOT EXISTS activity_type TEXT
  CHECK (activity_type IN ('phone','computer','consumable'))
  DEFAULT 'phone';
