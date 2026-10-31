-- =============================================
-- NETTOYAGE COMPLET DES DONNEES DE TEST
-- Supprime uniquement les donnees metier de la boutique cible.
-- shops, shop_members, user_roles_by_shop et profiles sont conserves.
-- =============================================

DO $$
DECLARE
  v_shop_id uuid := 'a2a00b1a-22d3-4303-bbf6-b8c6942a1ac5';
BEGIN
  IF to_regclass('public.cash_entries') IS NOT NULL THEN
    DELETE FROM public.cash_entries WHERE shop_id = v_shop_id;
  END IF;
  IF to_regclass('public.cash_exits') IS NOT NULL THEN
    DELETE FROM public.cash_exits WHERE shop_id = v_shop_id;
  END IF;
  IF to_regclass('public.cash_closures') IS NOT NULL THEN
    DELETE FROM public.cash_closures WHERE shop_id = v_shop_id;
  END IF;
  IF to_regclass('public.cash_sessions') IS NOT NULL THEN
    DELETE FROM public.cash_sessions WHERE shop_id = v_shop_id;
  END IF;

  IF to_regclass('public.workshop_payments') IS NOT NULL THEN
    DELETE FROM public.workshop_payments WHERE shop_id = v_shop_id;
  END IF;
  IF to_regclass('public.workshop_tickets') IS NOT NULL THEN
    DELETE FROM public.workshop_tickets WHERE shop_id = v_shop_id;
  END IF;

  IF to_regclass('public.sales') IS NOT NULL THEN
    DELETE FROM public.sales WHERE shop_id = v_shop_id;
  END IF;
  IF to_regclass('public.orders') IS NOT NULL THEN
    DELETE FROM public.orders WHERE shop_id = v_shop_id;
  END IF;
  IF to_regclass('public.supplier_orders') IS NOT NULL THEN
    DELETE FROM public.supplier_orders WHERE shop_id = v_shop_id;
  END IF;
  IF to_regclass('public.clients') IS NOT NULL THEN
    DELETE FROM public.clients WHERE shop_id = v_shop_id;
  END IF;
  IF to_regclass('public.pending_invitations') IS NOT NULL THEN
    DELETE FROM public.pending_invitations WHERE shop_id = v_shop_id;
  END IF;
  IF to_regclass('public.ticket_number_sequences') IS NOT NULL THEN
    DELETE FROM public.ticket_number_sequences WHERE shop_id = v_shop_id;
  END IF;
  IF to_regclass('public.products') IS NOT NULL THEN
    DELETE FROM public.products WHERE shop_id = v_shop_id;
  END IF;
END
$$;

-- Verification manuelle apres execution
-- SELECT 'workshop_tickets' AS t, COUNT(*) FROM public.workshop_tickets WHERE shop_id = 'a2a00b1a-22d3-4303-bbf6-b8c6942a1ac5'
-- UNION ALL SELECT 'workshop_payments', COUNT(*) FROM public.workshop_payments WHERE shop_id = 'a2a00b1a-22d3-4303-bbf6-b8c6942a1ac5'
-- UNION ALL SELECT 'clients', COUNT(*) FROM public.clients WHERE shop_id = 'a2a00b1a-22d3-4303-bbf6-b8c6942a1ac5'
-- UNION ALL SELECT 'sales', COUNT(*) FROM public.sales WHERE shop_id = 'a2a00b1a-22d3-4303-bbf6-b8c6942a1ac5'
-- UNION ALL SELECT 'shop_members (A GARDER)', COUNT(*) FROM public.shop_members WHERE shop_id = 'a2a00b1a-22d3-4303-bbf6-b8c6942a1ac5'
-- UNION ALL SELECT 'user_roles_by_shop (A GARDER)', COUNT(*) FROM public.user_roles_by_shop WHERE shop_id = 'a2a00b1a-22d3-4303-bbf6-b8c6942a1ac5';
