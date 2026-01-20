-- ============================================
-- Migration 024: Ajout vérification unicité email/slot pour admin
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-01-20
-- ============================================
-- Règle métier R-RESA-04: Un email ne peut avoir qu'une seule
-- réservation active par créneau (les annulées ne bloquent pas)
-- Applique la même règle pour les créations admin
-- ============================================

-- Supprimer TOUTES les versions de la fonction pour éviter les conflits
DO $$
DECLARE
  func_oid oid;
BEGIN
  FOR func_oid IN 
    SELECT oid FROM pg_proc 
    WHERE proname = 'create_admin_reservation' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.create_admin_reservation(' || 
      pg_get_function_identity_arguments(func_oid) || ') CASCADE';
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_admin_reservation(
  p_slot_id UUID,
  p_num_places INTEGER,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_email_secondary TEXT DEFAULT NULL,
  p_phone_secondary TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_organization TEXT DEFAULT NULL,
  p_function TEXT DEFAULT NULL,
  p_afc_number TEXT DEFAULT NULL,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation_id UUID;
  v_slot_exists BOOLEAN;
  v_user_id UUID;
  v_user_role TEXT;
  v_existing_reservation_id UUID;
  v_normalized_email TEXT;
BEGIN
  -- ============================================
  -- 0. Normaliser l'email en minuscules
  -- ============================================
  v_normalized_email := LOWER(TRIM(p_email));

  -- ============================================
  -- 1. Vérifier que l'utilisateur est connecté et a un rôle admin
  -- ============================================
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Utilisateur non connecté');
  END IF;
  
  -- Vérifier le rôle
  SELECT role INTO v_user_role
  FROM public.user_roles
  WHERE user_id = v_user_id
  AND role IN ('super-admin', 'admin', 'externe')
  LIMIT 1;
  
  IF v_user_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Accès non autorisé - rôle admin requis');
  END IF;

  -- ============================================
  -- 2. Vérifier que le slot existe
  -- ============================================
  SELECT EXISTS (
    SELECT 1 FROM public.slots WHERE id = p_slot_id
  ) INTO v_slot_exists;
  
  IF NOT v_slot_exists THEN
    RETURN json_build_object('success', false, 'error', 'Créneau invalide ou inexistant');
  END IF;

  -- ============================================
  -- 3. Vérifier unicité email/slot (R-RESA-04)
  -- Une réservation annulée ne bloque pas
  -- ============================================
  SELECT id INTO v_existing_reservation_id
  FROM public.reservations
  WHERE slot_id = p_slot_id
    AND LOWER(guest_email) = v_normalized_email
    AND status != 'cancelled'
  LIMIT 1;

  IF v_existing_reservation_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'DUPLICATE_EMAIL_SLOT:' || v_normalized_email
    );
  END IF;

  -- ============================================
  -- 4. Créer la réservation avec source='admin'
  -- Les triggers gèrent automatiquement:
  --   - Validation du spectacle publié (si applicable)
  --   - Vérification max_reservations_per_booking
  --   - Vérification capacité restante
  --   - Décrémentation de remaining_capacity
  -- ============================================
  INSERT INTO public.reservations (
    slot_id,
    num_places,
    status,
    source,
    created_by_user_id,
    -- Données guest
    guest_first_name,
    guest_last_name,
    guest_email,
    guest_phone,
    guest_function,
    guest_structure,
    guest_afc_number,
    guest_email_secondary,
    guest_phone_secondary,
    guest_address,
    guest_postal_code,
    guest_city,
    -- Commentaire
    special_requests
  ) VALUES (
    p_slot_id,
    p_num_places,
    'confirmed',
    'admin',
    v_user_id,
    -- Données guest
    p_first_name,
    p_last_name,
    v_normalized_email, -- Email normalisé
    NULLIF(p_phone, ''),
    NULLIF(p_function, ''),
    NULLIF(p_organization, ''), -- organization → guest_structure
    NULLIF(p_afc_number, ''),
    NULLIF(p_email_secondary, ''),
    NULLIF(p_phone_secondary, ''),
    NULLIF(p_address, ''),
    NULLIF(p_postal_code, ''),
    NULLIF(p_city, ''),
    -- Commentaire
    NULLIF(p_comment, '')
  )
  RETURNING id INTO v_reservation_id;

  RETURN json_build_object(
    'success', true, 
    'reservation_id', v_reservation_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Retourner l'erreur de manière structurée
    RETURN json_build_object(
      'success', false, 
      'error', SQLERRM
    );
END;
$$;

-- Commentaire mis à jour
COMMENT ON FUNCTION public.create_admin_reservation IS 
  'Crée une réservation depuis le back-office admin avec vérification unicité email/slot (R-RESA-04). Requiert un rôle admin.';
