ALTER TABLE public.storage_locations
  DROP CONSTRAINT IF EXISTS storage_locations_location_type_check;

ALTER TABLE public.storage_locations
  ADD CONSTRAINT storage_locations_location_type_check
  CHECK (location_type IN ('carton', 'cabinet', 'shelf', 'locker', 'drawer', 'cashbox', 'bag', 'other'));

DROP POLICY IF EXISTS "Owners manage storage locations" ON public.storage_locations;
DROP POLICY IF EXISTS "Shop staff insert storage locations" ON public.storage_locations;
DROP POLICY IF EXISTS "Shop staff update storage locations" ON public.storage_locations;
DROP POLICY IF EXISTS "Shop staff delete storage locations" ON public.storage_locations;

CREATE POLICY "Shop staff insert storage locations"
  ON public.storage_locations FOR INSERT TO authenticated
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'receptionniste')
    )
  );

CREATE POLICY "Shop staff update storage locations"
  ON public.storage_locations FOR UPDATE TO authenticated
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'receptionniste')
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'receptionniste')
    )
  );

CREATE POLICY "Shop staff delete storage locations"
  ON public.storage_locations FOR DELETE TO authenticated
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'receptionniste')
    )
  );
