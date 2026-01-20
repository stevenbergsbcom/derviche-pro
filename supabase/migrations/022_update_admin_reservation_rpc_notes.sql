-- ============================================
-- Migration 022: Update admin reservation RPC with notes fields
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-01-20
-- ============================================
-- Ajoute les champs de notes manquants:
-- - checkin_comment (Notes check-in)
-- - checkin_venue_notes (Notes lieu)
-- - checkin_internal_notes (Notes internes)
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
  -- Nouveaux champs de notes
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
BEGIN
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
  -- 3. Créer la réservation avec source='admin'
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
    NULLIF(p_checkin_internal_notes, '')
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

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.create_admin_reservation IS 
  'Crée une réservation depuis le back-office admin. Requiert un rôle admin (super-admin, admin, externe). Traçabilité via source=admin et created_by_user_id. Supporte les notes check-in, lieu et internes.';
