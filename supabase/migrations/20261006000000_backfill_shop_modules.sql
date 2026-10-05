-- Activate all modules for existing shops so existing users keep their current access.
INSERT INTO public.shop_modules (shop_id, module_code)
SELECT shops.id, modules.code
FROM public.shops AS shops
CROSS JOIN public.activity_modules AS modules
WHERE NOT EXISTS (
  SELECT 1
  FROM public.shop_modules AS existing
  WHERE existing.shop_id = shops.id
    AND existing.module_code = modules.code
)
ON CONFLICT (shop_id, module_code) DO NOTHING;

-- Populate selected_modules for subscriptions that have not chosen modules yet.
UPDATE public.subscriptions AS subscription
SET selected_modules = ARRAY(
  SELECT shop_module.module_code
  FROM public.shop_modules AS shop_module
  WHERE shop_module.shop_id IN (
    SELECT shop.id
    FROM public.shops AS shop
    WHERE shop.owner_id = subscription.user_id
  )
)
WHERE subscription.selected_modules = '{}' OR subscription.selected_modules IS NULL;
