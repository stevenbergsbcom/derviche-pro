-- ============================================
-- Migration 067: Permettre aux externes d'écrire les notes internes
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-03-08
-- ============================================
-- Les externes (role: 'externe') travaillent sur place avec les admins.
-- Décision métier : ils doivent pouvoir lire ET écrire checkin_internal_notes.
-- Avant cette migration : seuls super-admin et admin pouvaient écrire ces notes
-- dans la RPC create_admin_reservation.
-- Les fonctions updateCheckinStatus et updateGuestInfo (côté service TS)
-- sont également mises à jour via ADMIN_ROLES dans constants.ts.
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
  p_country TEXT DEFAULT NULL,
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
  -- 5. Créer la réservation
  -- Notes internes : autorisées pour super-admin, admin ET externe.
  -- Les compagnies ne peuvent jamais écrire ces notes (ELSE NULL).
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
    guest_country,
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
    LOWER(p_email),
    NULLIF(p_phone, ''),
    NULLIF(p_function, ''),
    NULLIF(p_organization, ''),
    NULLIF(p_afc_number, ''),
    NULLIF(p_email_secondary, ''),
    NULLIF(p_phone_secondary, ''),
    NULLIF(p_address, ''),
    NULLIF(p_postal_code, ''),
    NULLIF(p_city, ''),
    NULLIF(p_country, ''),
    -- Notes
    NULLIF(p_comment, ''),
    NULLIF(p_checkin_comment, ''),
    NULLIF(p_checkin_venue_notes, ''),
    -- Notes internes : super-admin, admin ET externe autorisés. Jamais les compagnies.
    CASE WHEN v_user_role IN ('super-admin', 'admin', 'externe')
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
    RETURN json_build_object(
      'success', false, 
      'error', 'Erreur lors de la création de la réservation'
    );
END;
$$;

COMMENT ON FUNCTION public.create_admin_reservation IS 
  'Crée une réservation depuis le back-office ou PWA. Requiert un rôle admin (super-admin, admin, externe) ou company (sur leurs propres spectacles). Notes internes autorisées pour super-admin, admin et externe uniquement.';
