-- ============================================
-- Migration 025: Block admin users from public reservations
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-01-21
-- ============================================
-- SÉCURITÉ: Cette migration ajoute une vérification côté serveur
-- pour empêcher les utilisateurs admin (super-admin, admin, externe)
-- de créer des réservations via le formulaire public.
-- 
-- La vérification côté client existe déjà, mais elle peut être contournée.
-- Cette vérification serveur est la protection définitive.
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
BEGIN
  -- ============================================
  -- 0. SÉCURITÉ: Vérifier si l'utilisateur connecté est un admin
  -- Les admins doivent utiliser l'interface admin pour réserver
  -- ============================================
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NOT NULL THEN
    -- Récupérer le rôle de l'utilisateur
    SELECT role INTO v_user_role
    FROM public.user_roles
    WHERE user_id = v_current_user_id;
    
    -- Bloquer si c'est un admin
    IF v_user_role IN ('super-admin', 'admin', 'externe') THEN
      RAISE EXCEPTION 'Les administrateurs ne peuvent pas réserver via le formulaire public. Veuillez utiliser l''interface d''administration.';
    END IF;
  END IF;

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

-- Commentaire mis à jour
COMMENT ON FUNCTION public.create_public_reservation IS 
  'Crée une réservation pour un visiteur anonyme (guest). SECURITY DEFINER permet de contourner les RLS. Bloque les utilisateurs admin.';
