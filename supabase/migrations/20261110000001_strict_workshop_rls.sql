-- 1. Supprimer les anciennes policies permissives
DROP POLICY IF EXISTS "workshop_select" ON public.workshop_tickets;
DROP POLICY IF EXISTS "Authenticated users can view workshop tickets" ON public.workshop_tickets;

-- 2. Restreindre l'accès au shop_id de l'utilisateur
CREATE POLICY "workshop_tickets_select_by_shop"
  ON public.workshop_tickets FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid()
    )
  );

-- 3. Restreindre les techniciens à leurs fiches assignées.
-- Les policies permissives sont combinées avec OR : cette policy doit donc être restrictive.
CREATE POLICY "workshop_tickets_select_technician"
  ON public.workshop_tickets AS RESTRICTIVE FOR SELECT
  USING (
    technicien_id = auth.uid()
    OR shop_id IN (
      SELECT shop_id FROM public.user_roles_by_shop
      WHERE user_id = auth.uid() AND role IN ('owner', 'receptionniste', 'caissier')
    )
  );
