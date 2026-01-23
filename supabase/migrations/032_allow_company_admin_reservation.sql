-- ============================================
-- Migration 032: Allow company role in create_admin_reservation RPC
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-01-23
-- ============================================
-- Permet aux compagnies de créer des réservations sur leurs propres 
-- spectacles où hosted_by = 'company'
-- ============================================

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
  p_comment TEXT DEFAULT NULL,
  -- Champs de notes
  p_checkin_comment TEXT DEFAULT NULL,
  p_checkin_venue_notes TEXT DEFAULT NULL,
  p_checkin_internal_notes TEXT DEFAULT NULL
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
  v_user_company_id UUID;
  v_slot_company_id UUID;
  v_slot_hosted_by TEXT;
BEGIN
  -- ============================================
  -- 1. Vérifier que l'utilisateur est connecté
  -- ============================================
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Utilisateur non connecté');
  END IF;
  
  -- ============================================
  -- 2. Vérifier le rôle (super-admin, admin, externe OU company)
  -- ============================================
  SELECT role INTO v_user_role
  FROM public.user_roles
  WHERE user_id = v_user_id
  AND role IN ('super-admin', 'admin', 'externe', 'company')
  LIMIT 1;
  
  IF v_user_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Accès non autorisé - rôle insuffisant');
  END IF;

  -- ============================================
  -- 3. Vérifier que le slot existe
  -- ============================================
  SELECT 
    EXISTS (SELECT 1 FROM public.slots WHERE id = p_slot_id),
    s.hosted_by,
    sh.company_id
  INTO v_slot_exists, v_slot_hosted_by, v_slot_company_id
  FROM public.slots s
  JOIN public.shows sh ON sh.id = s.show_id
  WHERE s.id = p_slot_id;
  
  IF NOT v_slot_exists THEN
    RETURN json_build_object('success', false, 'error', 'Créneau invalide ou inexistant');
  END IF;

  -- ============================================
  -- 4. Pour les compagnies : vérifier l'accès au slot
  -- ============================================
  IF v_user_role = 'company' THEN
    -- Récupérer le company_id de l'utilisateur
    SELECT company_id INTO v_user_company_id
    FROM public.profiles
    WHERE id = v_user_id;
    
    -- Vérifier que le slot appartient à un spectacle de la compagnie
    -- ET que hosted_by = 'company'
    IF v_slot_company_id IS NULL OR v_slot_company_id != v_user_company_id THEN
      RETURN json_build_object('success', false, 'error', 'Ce créneau n''appartient pas à votre compagnie');
    END IF;
    
    IF v_slot_hosted_by != 'company' THEN
      RETURN json_build_object('success', false, 'error', 'Vous ne pouvez créer des réservations que sur les créneaux gérés par votre compagnie');
    END IF;
  END IF;

  -- ============================================
  -- 5. Créer la réservation avec source='admin'
  -- Les triggers gèrent automatiquement:
  --   - Validation du spectacle publié (si applicable)
  --   - Vérification max_reservations_per_booking
  --   - Vérification capacité restante
  --   - Décrémentation de remaining_capacity
  -- ============================================
  -- Note: Pour les compagnies, on n'enregistre PAS les internal_notes
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
    -- Notes
    special_requests,
    checkin_comment,
    checkin_venue_notes,
    checkin_internal_notes
  ) VALUES (
    p_slot_id,
    p_num_places,
    'confirmed',
    'admin',
    v_user_id,
    -- Données guest
    p_first_name,
    p_last_name,
    LOWER(p_email), -- Normaliser l'email en minuscules
    NULLIF(p_phone, ''),
    NULLIF(p_function, ''),
    NULLIF(p_organization, ''), -- organization → guest_structure
    NULLIF(p_afc_number, ''),
    NULLIF(p_email_secondary, ''),
    NULLIF(p_phone_secondary, ''),
    NULLIF(p_address, ''),
    NULLIF(p_postal_code, ''),
    NULLIF(p_city, ''),
    -- Notes
    NULLIF(p_comment, ''),
    NULLIF(p_checkin_comment, ''),
    NULLIF(p_checkin_venue_notes, ''),
    -- Internal notes: uniquement pour super-admin et admin
    CASE WHEN v_user_role IN ('super-admin', 'admin') 
         THEN NULLIF(p_checkin_internal_notes, '')
         ELSE NULL
    END
  )
  RETURNING id INTO v_reservation_id;

  RETURN json_build_object(
    'success', true, 
    'reservation_id', v_reservation_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Retourner une erreur générique (pas de détails techniques)
    RETURN json_build_object(
      'success', false, 
      'error', 'Erreur lors de la création de la réservation'
    );
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.create_admin_reservation IS 
  'Crée une réservation depuis le back-office ou PWA. Requiert un rôle admin (super-admin, admin, externe) ou company (sur leurs propres spectacles). Traçabilité via source=admin et created_by_user_id.';
