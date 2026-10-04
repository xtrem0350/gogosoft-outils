CREATE TABLE IF NOT EXISTS public.activity_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

INSERT INTO public.shop_modules (shop_id, module_code)
SELECT shops.id, activity_modules.code
FROM public.shops AS shops
CROSS JOIN public.activity_modules AS activity_modules
WHERE activity_modules.is_active = true
ON CONFLICT (shop_id, module_code) DO NOTHING;

ALTER TABLE public.shop_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view shop modules" ON public.shop_modules;
CREATE POLICY "Members view shop modules" ON public.shop_modules FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_members.shop_id = shop_modules.shop_id
      AND shop_members.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Owners manage shop modules" ON public.shop_modules;
CREATE POLICY "Owners manage shop modules" ON public.shop_modules FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = shop_modules.shop_id AND shops.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = shop_modules.shop_id AND shops.owner_id = auth.uid()
  ));

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS selected_modules TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS price_fcfa INTEGER NOT NULL DEFAULT 0;

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

INSERT INTO public.pricing_config (
  plan_code, plan_label, min_modules, max_modules, monthly_price_fcfa, annual_price_fcfa
) VALUES
  ('essentiel', 'Essentiel', 1, 1, 3000, 30000),
  ('pro', 'Pro', 2, 3, 5000, 50000),
  ('business', 'Business', 4, 5, 10000, 100000)
ON CONFLICT (plan_code) DO NOTHING;

ALTER TABLE public.activity_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active modules" ON public.activity_modules;
CREATE POLICY "Anyone can read active modules" ON public.activity_modules FOR SELECT
  TO authenticated, anon USING (is_active = true);

ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read pricing" ON public.pricing_config;
CREATE POLICY "Anyone can read pricing" ON public.pricing_config FOR SELECT
  TO authenticated, anon USING (is_active = true);

DROP POLICY IF EXISTS "Super admins manage pricing" ON public.pricing_config;
CREATE POLICY "Super admins manage pricing" ON public.pricing_config FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
  ));