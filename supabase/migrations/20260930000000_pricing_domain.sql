ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS domain_requested TEXT,
ADD COLUMN IF NOT EXISTS domain_status TEXT
  CHECK (domain_status IN ('none', 'pending', 'active', 'transferred')) DEFAULT 'none',
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
