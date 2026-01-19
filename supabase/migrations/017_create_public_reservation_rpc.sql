-- ============================================
-- Migration 017: Create public reservation RPC function
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-01-16
-- ============================================
-- Cette fonction permet aux utilisateurs anonymes de créer des réservations
-- en contournant les RLS avec SECURITY DEFINER.
-- Les triggers existants gèrent automatiquement:
--   - La validation des règles métier (trigger_validate_reservation)
--   - La mise à jour de remaining_capacity (trigger_update_slot_capacity)
-- ============================================

CREATE OR REPLACE FUNCTION public.create_public_reservation(
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
  p_comment TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation_id UUID;
  v_slot_exists BOOLEAN;
BEGIN
  -- ============================================
  -- 1. Vérifier que le slot existe
  -- ============================================
  SELECT EXISTS (
    SELECT 1 FROM public.slots WHERE id = p_slot_id
  ) INTO v_slot_exists;
  
  IF NOT v_slot_exists THEN
    RAISE EXCEPTION 'Créneau invalide ou inexistant';
  END IF;

  -- ============================================
  -- 2. Créer la réservation
  -- Les triggers gèrent automatiquement:
  --   - Validation du spectacle publié
  --   - Vérification max_reservations_per_booking
  --   - Vérification capacité restante
  --   - Décrémentation de remaining_capacity
  -- ============================================
  INSERT INTO public.reservations (
    slot_id,
    num_places,
    status,
    -- Données guest
    guest_first_name,
    guest_last_name,
    guest_email,
    guest_phone,
    guest_function,
    guest_structure,
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
    -- Données guest
    p_first_name,
    p_last_name,
    LOWER(p_email), -- Normaliser l'email en minuscules
    NULLIF(p_phone, ''),
    NULLIF(p_function, ''),
    NULLIF(p_organization, ''), -- organization → guest_structure
    NULLIF(p_email_secondary, ''),
    NULLIF(p_phone_secondary, ''),
    NULLIF(p_address, ''),
    NULLIF(p_postal_code, ''),
    NULLIF(p_city, ''),
    -- Commentaire
    NULLIF(p_comment, '')
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-lever l'exception avec le message original
    -- Les triggers peuvent lever des exceptions spécifiques
    RAISE;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.create_public_reservation IS 
  'Crée une réservation pour un visiteur anonyme (guest). SECURITY DEFINER permet de contourner les RLS.';

-- ============================================
-- Permissions : Autoriser les appels anonymes
-- ============================================
GRANT EXECUTE ON FUNCTION public.create_public_reservation TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_reservation TO authenticated;
