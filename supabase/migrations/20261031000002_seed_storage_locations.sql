-- Create three storage locations (C1, C2, C3) for each shop that does not have them.
INSERT INTO public.storage_locations (shop_id, name, location_type, status)
SELECT s.id, seed.name, 'carton', 'available'
FROM public.shops s
CROSS JOIN (VALUES ('C1'), ('C2'), ('C3')) AS seed(name)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.storage_locations storage
  WHERE storage.shop_id = s.id AND storage.name = seed.name
)
ON CONFLICT DO NOTHING;
