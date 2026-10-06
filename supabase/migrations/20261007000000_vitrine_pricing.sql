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

CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_slug
  ON public.shops(shop_slug) WHERE shop_slug IS NOT NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-assets', 'shop-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Shop members upload shop assets" ON storage.objects;
CREATE POLICY "Shop members upload shop assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'shop-assets'
    AND public.is_shop_member((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "Shop members update shop assets" ON storage.objects;
CREATE POLICY "Shop members update shop assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'shop-assets'
    AND public.is_shop_member((storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'shop-assets'
    AND public.is_shop_member((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "Shop members delete shop assets" ON storage.objects;
CREATE POLICY "Shop members delete shop assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'shop-assets'
    AND public.is_shop_member((storage.foldername(name))[1]::uuid)
  );

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'phone'
    CHECK (category IN ('phone','computer','accessory','consumable','other')),
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
  USING (public.is_shop_owner(shop_id))
  WITH CHECK (public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "Public read available products" ON public.products;
CREATE POLICY "Public read available products" ON public.products FOR SELECT TO anon, authenticated
  USING (
    is_available = true
    AND EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = products.shop_id AND shops.is_online_shop = true
    )
  );

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
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('wave','orange_money','mtn','moov','cash_on_delivery','cash_on_pickup')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','refunded','failed')),
  delivery_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending','confirmed','preparing','ready','delivering','delivered','cancelled')),
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
CREATE POLICY "Members view orders" ON public.orders FOR SELECT TO authenticated
  USING (public.is_shop_member(shop_id));
DROP POLICY IF EXISTS "Owners manage orders" ON public.orders;
CREATE POLICY "Owners manage orders" ON public.orders FOR ALL TO authenticated
  USING (public.is_shop_owner(shop_id))
  WITH CHECK (public.is_shop_owner(shop_id));

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
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND public.is_shop_member(o.shop_id)
  ));
DROP POLICY IF EXISTS "Owners manage order items" ON public.order_items;
CREATE POLICY "Owners manage order items" ON public.order_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND public.is_shop_owner(o.shop_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND public.is_shop_owner(o.shop_id)
  ));

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_public_shop_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  shop_slug TEXT,
  shop_logo_url TEXT,
  shop_description TEXT,
  shop_banner_url TEXT,
  shop_phone TEXT,
  shop_address TEXT,
  shop_whatsapp TEXT,
  accepts_wave BOOLEAN,
  accepts_orange_money BOOLEAN,
  accepts_mtn BOOLEAN,
  accepts_moov BOOLEAN,
  accepts_cash_on_pickup BOOLEAN,
  accepts_cash_on_delivery BOOLEAN,
  delivery_fee INTEGER,
  delivery_available BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.id, s.name, s.shop_slug, s.shop_logo_url, s.shop_description,
    s.shop_banner_url, s.shop_phone, s.shop_address, s.shop_whatsapp,
    s.accepts_wave, s.accepts_orange_money, s.accepts_mtn, s.accepts_moov,
    s.accepts_cash_on_pickup, s.accepts_cash_on_delivery, s.delivery_fee,
    s.delivery_available
  FROM public.shops s
  WHERE s.shop_slug = p_slug AND s.is_online_shop = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_shop_by_slug(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_shop_by_slug(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_public_order(
  p_shop_id UUID,
  p_client_name TEXT,
  p_client_whatsapp TEXT,
  p_client_address TEXT,
  p_client_notes TEXT,
  p_payment_method TEXT,
  p_delivery BOOLEAN,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  shop_row public.shops%ROWTYPE;
  input_item JSONB;
  product_row public.products%ROWTYPE;
  item_quantity INTEGER;
  item_total INTEGER;
  subtotal_amount INTEGER := 0;
  delivery_amount INTEGER := 0;
  line_snapshots JSONB := '[]'::JSONB;
  count_today INTEGER;
  generated_number TEXT;
  new_order public.orders%ROWTYPE;
  item_count INTEGER;
BEGIN
  IF length(trim(coalesce(p_client_name, ''))) < 2 OR length(trim(coalesce(p_client_whatsapp, ''))) < 8 THEN
    RAISE EXCEPTION 'Nom et numéro WhatsApp valides requis.';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'Le panier est invalide.';
  END IF;
  item_count := jsonb_array_length(p_items);
  IF item_count < 1 OR item_count > 50 THEN
    RAISE EXCEPTION 'Le panier doit contenir entre 1 et 50 lignes.';
  END IF;

  SELECT * INTO shop_row FROM public.shops
  WHERE id = p_shop_id AND is_online_shop = true FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cette boutique en ligne est indisponible.'; END IF;

  IF p_delivery AND NOT shop_row.delivery_available THEN
    RAISE EXCEPTION 'La livraison n''est pas disponible.';
  END IF;
  IF p_delivery AND length(trim(coalesce(p_client_address, ''))) < 4 THEN
    RAISE EXCEPTION 'Une adresse est requise pour la livraison.';
  END IF;
  IF NOT (
    (p_payment_method = 'wave' AND shop_row.accepts_wave)
    OR (p_payment_method = 'orange_money' AND shop_row.accepts_orange_money)
    OR (p_payment_method = 'mtn' AND shop_row.accepts_mtn)
    OR (p_payment_method = 'moov' AND shop_row.accepts_moov)
    OR (p_payment_method = 'cash_on_pickup' AND shop_row.accepts_cash_on_pickup AND NOT p_delivery)
    OR (p_payment_method = 'cash_on_delivery' AND shop_row.accepts_cash_on_delivery AND p_delivery)
  ) THEN
    RAISE EXCEPTION 'Ce moyen de paiement n''est pas accepté par la boutique.';
  END IF;

  delivery_amount := CASE WHEN p_delivery THEN shop_row.delivery_fee ELSE 0 END;

  FOR input_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    item_quantity := (input_item->>'quantity')::INTEGER;
    IF item_quantity < 1 OR item_quantity > 99 THEN
      RAISE EXCEPTION 'La quantité doit être comprise entre 1 et 99.';
    END IF;

    SELECT * INTO product_row FROM public.products
    WHERE id = (input_item->>'product_id')::UUID
      AND shop_id = p_shop_id AND is_available = true
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Un produit du panier n''est plus disponible.'; END IF;
    IF product_row.stock < item_quantity THEN
      RAISE EXCEPTION 'Stock insuffisant pour : %.', product_row.name;
    END IF;

    UPDATE public.products SET stock = stock - item_quantity WHERE id = product_row.id;
    item_total := product_row.price * item_quantity;
    subtotal_amount := subtotal_amount + item_total;
    input_item := jsonb_build_object(
      'product_id', product_row.id,
      'product_name', product_row.name,
      'product_image_url', product_row.image_urls[1],
      'quantity', item_quantity,
      'unit_price', product_row.price,
      'total', item_total
    );
    line_snapshots := line_snapshots || jsonb_build_array(input_item);
  END LOOP;

  PERFORM pg_advisory_xact_lock(hashtext(p_shop_id::TEXT));
  SELECT COUNT(*) INTO count_today FROM public.orders
  WHERE shop_id = p_shop_id AND created_at::DATE = CURRENT_DATE;
  generated_number := 'CMD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-'
    || REPLACE(p_shop_id::TEXT, '-', '') || '-' || LPAD((count_today + 1)::TEXT, 4, '0');

  INSERT INTO public.orders (
    shop_id, order_number, client_name, client_whatsapp, client_address,
    client_notes, subtotal, delivery_fee, total, payment_method
  ) VALUES (
    p_shop_id, generated_number, trim(p_client_name), trim(p_client_whatsapp),
    NULLIF(trim(coalesce(p_client_address, '')), ''),
    NULLIF(trim(coalesce(p_client_notes, '')), ''), subtotal_amount,
    delivery_amount, subtotal_amount + delivery_amount, p_payment_method
  ) RETURNING * INTO new_order;

  INSERT INTO public.order_items (
    order_id, product_id, product_name, product_image_url, quantity, unit_price, total
  )
  SELECT new_order.id, (item->>'product_id')::UUID, item->>'product_name',
    item->>'product_image_url', (item->>'quantity')::INTEGER,
    (item->>'unit_price')::INTEGER, (item->>'total')::INTEGER
  FROM jsonb_array_elements(line_snapshots) AS item;

  RETURN jsonb_build_object(
    'id', new_order.id,
    'order_number', new_order.order_number,
    'tracking_token', new_order.tracking_token,
    'subtotal', new_order.subtotal,
    'delivery_fee', new_order.delivery_fee,
    'total', new_order.total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_order(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_order(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_order(p_order_id UUID, p_tracking_token UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'client_name', o.client_name,
    'subtotal', o.subtotal,
    'delivery_fee', o.delivery_fee,
    'total', o.total,
    'payment_method', o.payment_method,
    'payment_status', o.payment_status,
    'delivery_status', o.delivery_status,
    'created_at', o.created_at,
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'product_image_url', oi.product_image_url,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total', oi.total
      )) FROM public.order_items oi WHERE oi.order_id = o.id
    ), '[]'::JSONB),
    'shop', jsonb_build_object(
      'name', s.name,
      'shop_phone', s.shop_phone,
      'shop_whatsapp', s.shop_whatsapp,
      'shop_slug', s.shop_slug
    )
  )
  FROM public.orders o
  JOIN public.shops s ON s.id = o.shop_id
  WHERE o.id = p_order_id AND o.tracking_token = p_tracking_token AND s.is_online_shop = true;
$$;

REVOKE ALL ON FUNCTION public.get_public_order(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order(UUID, UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_shop_order(
  p_order_id UUID,
  p_delivery_status TEXT,
  p_payment_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  order_row public.orders%ROWTYPE;
  order_item public.order_items%ROWTYPE;
BEGIN
  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR NOT public.is_shop_owner(order_row.shop_id) THEN
    RAISE EXCEPTION 'Commande introuvable ou accès refusé.';
  END IF;
  IF order_row.delivery_status = 'cancelled' AND p_delivery_status <> 'cancelled' THEN
    RAISE EXCEPTION 'Une commande annulée ne peut pas être réouverte.';
  END IF;
  IF p_delivery_status NOT IN ('pending','confirmed','preparing','ready','delivering','delivered','cancelled')
    OR p_payment_status NOT IN ('pending','paid','refunded','failed') THEN
    RAISE EXCEPTION 'Statut de commande invalide.';
  END IF;

  IF p_delivery_status = 'cancelled' AND order_row.delivery_status <> 'cancelled' THEN
    FOR order_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
      IF order_item.product_id IS NOT NULL THEN
        UPDATE public.products SET stock = stock + order_item.quantity
        WHERE id = order_item.product_id AND shop_id = order_row.shop_id;
      END IF;
    END LOOP;
  END IF;
  UPDATE public.orders SET delivery_status = p_delivery_status, payment_status = p_payment_status
  WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_shop_order(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_shop_order(UUID, TEXT, TEXT) TO authenticated;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS storefront_modules TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS domain_included BOOLEAN NOT NULL DEFAULT false;

INSERT INTO public.activity_modules (code, label, icon, description)
VALUES
  ('shop_phone', 'Vitrine téléphone', 'Smartphone', 'Présenter et vendre des téléphones en ligne'),
  ('shop_computer', 'Vitrine ordinateur', 'Laptop', 'Présenter et vendre des ordinateurs en ligne')
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  is_active = true;

DELETE FROM public.pricing_config;
INSERT INTO public.pricing_config (
  plan_code, plan_label, min_modules, max_modules, monthly_price_fcfa, annual_price_fcfa
) VALUES
  ('app_1', 'Application - 1 module', 1, 1, 6000, 60000),
  ('app_2', 'Application - 2 modules', 2, 2, 10000, 100000),
  ('app_all', 'Application - Tous modules', 3, 5, 15000, 150000),
  ('shop_1', 'Vitrine - 1 activité', 1, 1, 20000, 200000),
  ('shop_2', 'Vitrine - 2 activités', 2, 2, 30000, 300000);
