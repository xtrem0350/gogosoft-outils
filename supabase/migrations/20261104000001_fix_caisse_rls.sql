-- 1. Nettoyer les policies permissives sur sales
DROP POLICY IF EXISTS "Members manage sales" ON public.sales;
DROP POLICY IF EXISTS "Members view sales" ON public.sales;
DROP POLICY IF EXISTS "sales_all_members" ON public.sales;

-- 2. Recréer des policies restrictives sur sales
CREATE POLICY "sales_select_owner_caissier_vendeur"
  ON public.sales FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier', 'vendeur')
    )
  );

CREATE POLICY "sales_insert_owner_caissier_vendeur"
  ON public.sales FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier', 'vendeur')
    )
  );

CREATE POLICY "sales_update_owner_caissier"
  ON public.sales FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier')
    )
  );

-- 3. Nettoyer les policies permissives sur workshop_tickets
DROP POLICY IF EXISTS "Allow all authenticated" ON public.workshop_tickets;
DROP POLICY IF EXISTS "Enable read for all authenticated" ON public.workshop_tickets;
DROP POLICY IF EXISTS "Enable insert for all authenticated" ON public.workshop_tickets;

-- 4. Recréer des policies restrictives sur workshop_tickets
CREATE POLICY "tickets_select_shop_members"
  ON public.workshop_tickets FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tickets_insert_owner_caissier_receptionniste"
  ON public.workshop_tickets FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier', 'receptionniste', 'technicien')
    )
  );

CREATE POLICY "tickets_update_owner_caissier_receptionniste_technicien"
  ON public.workshop_tickets FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier', 'receptionniste', 'technicien')
    )
  );

-- 5. Activer RLS sur les tables manquantes
ALTER TABLE public.workshop_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_exits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_closures ENABLE ROW LEVEL SECURITY;

-- 6. Policies workshop_payments
CREATE POLICY "workshop_payments_select_owner_caissier_receptionniste"
  ON public.workshop_payments FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier', 'receptionniste')
    )
  );

CREATE POLICY "workshop_payments_insert_owner_caissier"
  ON public.workshop_payments FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier')
    )
  );

-- 7. Policies cash_exits
CREATE POLICY "cash_exits_select_owner_caissier"
  ON public.cash_exits FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier')
    )
  );

CREATE POLICY "cash_exits_insert_owner_caissier"
  ON public.cash_exits FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier')
    )
  );

-- 8. Policies cash_closures
CREATE POLICY "cash_closures_select_owner_caissier"
  ON public.cash_closures FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'caissier')
    )
  );
