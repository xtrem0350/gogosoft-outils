CREATE OR REPLACE FUNCTION public.create_sale_with_stock(
  p_shop_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_client_id uuid DEFAULT NULL,
  p_client_name text DEFAULT NULL,
  p_client_whatsapp text DEFAULT NULL,
  p_payment_method text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_product RECORD;
  v_sale_id uuid;
  v_total integer;
  v_authorized boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Non authentifié.'; END IF;

  -- Vérifier le rôle
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles_by_shop
    WHERE shop_id = p_shop_id AND user_id = v_user_id
      AND role IN ('owner', 'caissier', 'vendeur')
  ) INTO v_authorized;
  IF NOT v_authorized THEN RAISE EXCEPTION 'Non autorisé.'; END IF;

  -- Verrouiller le produit
  SELECT * INTO v_product FROM public.products
  WHERE id = p_product_id AND shop_id = p_shop_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable.'; END IF;

  -- Vérifier le stock
  IF v_product.stock < p_quantity THEN
    RAISE EXCEPTION 'Stock insuffisant. Disponible : %', v_product.stock;
  END IF;

  -- Calculer le total
  v_total := v_product.price * p_quantity;

  -- Créer la vente
  INSERT INTO public.sales (
    shop_id, product_id, product_name, quantity, unit_price, total_price,
    client_id, client_name, client_whatsapp, payment_method, payment_status,
    created_by
  ) VALUES (
    p_shop_id, p_product_id, v_product.name, p_quantity, v_product.price, v_total,
    p_client_id, p_client_name, p_client_whatsapp, p_payment_method, 'en_attente_caissier',
    v_user_id
  ) RETURNING id INTO v_sale_id;

  -- Décrémenter le stock
  UPDATE public.products SET stock = stock - p_quantity WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'total', v_total
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.create_sale_with_stock(uuid, uuid, integer, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sale_with_stock(uuid, uuid, integer, uuid, text, text, text) TO authenticated;
