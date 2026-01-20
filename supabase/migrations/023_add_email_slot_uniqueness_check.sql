-- ============================================
-- Migration 023: Ajout vérification unicité email/slot
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-01-20
-- ============================================
-- Règle métier R-RESA-04: Un email ne peut avoir qu'une seule
-- réservation active par créneau (les annulées ne bloquent pas)
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
  v_existing_reservation_id UUID;
  v_normalized_email TEXT;
BEGIN
  -- ============================================
  -- 0. Normaliser l'email en minuscules
  -- ============================================
  v_normalized_email := LOWER(TRIM(p_email));

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
  -- 2. Vérifier unicité email/slot (R-RESA-04)
  -- Une réservation annulée ne bloque pas
  -- ============================================
  SELECT id INTO v_existing_reservation_id
  FROM public.reservations
  WHERE slot_id = p_slot_id
    AND LOWER(guest_email) = v_normalized_email
    AND status != 'cancelled'
  LIMIT 1;

  IF v_existing_reservation_id IS NOT NULL THEN
    RAISE EXCEPTION 'DUPLICATE_EMAIL_SLOT:%', v_normalized_email;
  END IF;

  -- ============================================
  -- 3. Créer la réservation
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
    v_normalized_email, -- Email normalisé
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
    RAISE;
END;
$$;

-- Commentaire mis à jour
COMMENT ON FUNCTION public.create_public_reservation IS 
  'Crée une réservation guest avec vérification unicité email/slot (R-RESA-04). SECURITY DEFINER.';
