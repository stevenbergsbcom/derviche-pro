-- ============================================
-- Migration 026: Renforcer la validation serveur dans create_public_reservation
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-01-21
-- ============================================
-- SÉCURITÉ: Cette migration ajoute des validations côté serveur :
--   - Format email valide
--   - Longueur maximale des champs
--   - Nombre de places (min/max)
--   - Champs obligatoires non vides
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
  v_current_user_id UUID;
  v_user_role TEXT;
  v_max_places INTEGER;
  v_email_regex TEXT := '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
BEGIN
  -- ============================================
  -- 0. SÉCURITÉ: Vérifier si l'utilisateur connecté est un admin
  -- ============================================
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NOT NULL THEN
    SELECT role INTO v_user_role
    FROM public.user_roles
    WHERE user_id = v_current_user_id;
    
    IF v_user_role IN ('super-admin', 'admin', 'externe') THEN
      RAISE EXCEPTION 'Les administrateurs ne peuvent pas réserver via le formulaire public. Veuillez utiliser l''interface d''administration.';
    END IF;
  END IF;

  -- ============================================
  -- 1. VALIDATION: Champs obligatoires
  -- ============================================
  IF p_first_name IS NULL OR TRIM(p_first_name) = '' THEN
    RAISE EXCEPTION 'Le prénom est obligatoire';
  END IF;
  
  IF p_last_name IS NULL OR TRIM(p_last_name) = '' THEN
    RAISE EXCEPTION 'Le nom est obligatoire';
  END IF;
  
  IF p_email IS NULL OR TRIM(p_email) = '' THEN
    RAISE EXCEPTION 'L''email est obligatoire';
  END IF;

  -- ============================================
  -- 2. VALIDATION: Format email (TRIM avant validation)
  -- ============================================
  IF NOT TRIM(p_email) ~* v_email_regex THEN
    RAISE EXCEPTION 'Format d''email invalide';
  END IF;
  
  -- Validation email secondaire si fourni
  IF p_email_secondary IS NOT NULL AND TRIM(p_email_secondary) != '' THEN
    IF NOT TRIM(p_email_secondary) ~* v_email_regex THEN
      RAISE EXCEPTION 'Format d''email secondaire invalide';
    END IF;
  END IF;

  -- ============================================
  -- 3. VALIDATION: Longueur des champs
  -- ============================================
  IF LENGTH(p_first_name) > 100 THEN
    RAISE EXCEPTION 'Le prénom ne peut pas dépasser 100 caractères';
  END IF;
  
  IF LENGTH(p_last_name) > 100 THEN
    RAISE EXCEPTION 'Le nom ne peut pas dépasser 100 caractères';
  END IF;
  
  IF LENGTH(p_email) > 255 THEN
    RAISE EXCEPTION 'L''email ne peut pas dépasser 255 caractères';
  END IF;
  
  IF p_phone IS NOT NULL AND LENGTH(p_phone) > 20 THEN
    RAISE EXCEPTION 'Le téléphone ne peut pas dépasser 20 caractères';
  END IF;
  
  IF p_address IS NOT NULL AND LENGTH(p_address) > 500 THEN
    RAISE EXCEPTION 'L''adresse ne peut pas dépasser 500 caractères';
  END IF;
  
  IF p_postal_code IS NOT NULL AND LENGTH(p_postal_code) > 10 THEN
    RAISE EXCEPTION 'Le code postal ne peut pas dépasser 10 caractères';
  END IF;
  
  IF p_city IS NOT NULL AND LENGTH(p_city) > 100 THEN
    RAISE EXCEPTION 'La ville ne peut pas dépasser 100 caractères';
  END IF;
  
  IF p_organization IS NOT NULL AND LENGTH(p_organization) > 200 THEN
    RAISE EXCEPTION 'L''organisation ne peut pas dépasser 200 caractères';
  END IF;
  
  IF p_function IS NOT NULL AND LENGTH(p_function) > 100 THEN
    RAISE EXCEPTION 'La fonction ne peut pas dépasser 100 caractères';
  END IF;
  
  IF p_comment IS NOT NULL AND LENGTH(p_comment) > 2000 THEN
    RAISE EXCEPTION 'Le commentaire ne peut pas dépasser 2000 caractères';
  END IF;

  -- ============================================
  -- 4. VALIDATION: Nombre de places
  -- ============================================
  IF p_num_places IS NULL OR p_num_places < 1 THEN
    RAISE EXCEPTION 'Le nombre de places doit être au minimum 1';
  END IF;
  
  IF p_num_places > 20 THEN
    RAISE EXCEPTION 'Le nombre de places ne peut pas dépasser 20 par réservation';
  END IF;

  -- ============================================
  -- 5. Vérifier que le slot existe
  -- ============================================
  SELECT EXISTS (
    SELECT 1 FROM public.slots WHERE id = p_slot_id
  ) INTO v_slot_exists;
  
  IF NOT v_slot_exists THEN
    RAISE EXCEPTION 'Créneau invalide ou inexistant';
  END IF;

  -- ============================================
  -- 6. Créer la réservation
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
    special_requests
  ) VALUES (
    p_slot_id,
    p_num_places,
    'confirmed',
    TRIM(p_first_name),
    TRIM(p_last_name),
    LOWER(TRIM(p_email)),
    NULLIF(TRIM(p_phone), ''),
    NULLIF(TRIM(p_function), ''),
    NULLIF(TRIM(p_organization), ''),
    NULLIF(LOWER(TRIM(p_email_secondary)), ''),
    NULLIF(TRIM(p_phone_secondary), ''),
    NULLIF(TRIM(p_address), ''),
    NULLIF(TRIM(p_postal_code), ''),
    NULLIF(TRIM(p_city), ''),
    NULLIF(TRIM(p_comment), '')
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Commentaire mis à jour
COMMENT ON FUNCTION public.create_public_reservation IS 
  'Crée une réservation guest avec validation complète côté serveur. Bloque les admins.';
