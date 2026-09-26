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

CREATE POLICY "Members view shop sales" ON public.sales FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = sales.shop_id AND user_id = auth.uid()));

CREATE POLICY "Members manage shop sales" ON public.sales FOR ALL
  USING (EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = sales.shop_id AND user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_sales_shop ON public.sales(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_activity ON public.sales(shop_id, activity_type);

INSERT INTO storage.buckets (id, name, public)
VALUES ('sales-product-photos', 'sales-product-photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Shop members upload sale photos'
  ) THEN
    CREATE POLICY "Shop members upload sale photos" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'sales-product-photos'
        AND EXISTS (
          SELECT 1 FROM public.shop_members
          WHERE shop_id::text = split_part(name, '/', 1)
            AND user_id = auth.uid()
        )
      );
  END IF;
END $$;
