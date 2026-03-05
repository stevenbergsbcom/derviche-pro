-- ============================================
-- Migration 064: Fix sécurité RPC create_walkin_reservation
-- Derviche Diffusion
-- Date: 2026-03-05
-- ============================================
-- Correction : l'accès externe doit être déterminé par slots.hosted_by_id
-- (pattern établi en migration 040) et NON par user_show_assignments.
--
-- Faille corrigée : un externe assigné via user_show_assignments mais
-- sans hosted_by_id sur le slot pouvait créer une réservation walk-in.
-- ============================================

CREATE OR REPLACE FUNCTION public.create_walkin_reservation(
  -- Slot & places
  p_slot_id UUID,
  p_num_places INTEGER,
  -- Données professionnelles
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
  -- Réservation
  p_special_requests TEXT DEFAULT NULL,
  p_checkin_venue_notes TEXT DEFAULT NULL,
  p_checkin_internal_notes TEXT DEFAULT NULL,
  -- Check-in optionnel à la création
  p_checkin_status TEXT DEFAULT NULL,
  -- Override capacité (admin/super-admin uniquement)
  p_override_capacity BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation_id UUID;
  v_user_id UUID;
  v_user_role TEXT;
  v_slot_remaining INTEGER;
  v_slot_show_id UUID;
  v_is_assigned BOOLEAN;
  v_capacity_warning BOOLEAN := FALSE;
BEGIN
  -- ============================================
  -- 1. Vérifier que l'utilisateur est connecté
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
    RETURN json_build_object('success', false, 'error', 'Accès non autorisé - rôle requis');
  END IF;

  -- ============================================
  -- 2. Vérifier et verrouiller le slot
  -- ============================================
  SELECT remaining_capacity, show_id
  INTO v_slot_remaining, v_slot_show_id
  FROM public.slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Créneau invalide ou inexistant');
  END IF;

  -- ============================================
  -- 3. Vérification accès pour l'externe
  --    Pattern migration 040 : slots.hosted_by_id (PAS user_show_assignments)
  -- ============================================
  IF v_user_role = 'externe' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.slots
      WHERE id = p_slot_id
        AND hosted_by_id = v_user_id
    ) INTO v_is_assigned;

    IF NOT v_is_assigned THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Accès refusé - vous n''êtes pas assigné à ce créneau'
      );
    END IF;

    -- Les externes ne peuvent PAS forcer l'override de capacité
    IF p_override_capacity THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Seul un admin peut forcer la création sur un créneau complet'
      );
    END IF;
  END IF;

  -- ============================================
  -- 4. Vérification / gestion de la capacité
  -- ============================================
  IF v_slot_remaining < p_num_places THEN
    IF NOT p_override_capacity THEN
      RETURN json_build_object(
        'success', false,
        'capacity_warning', true,
        'remaining', v_slot_remaining,
        'requested', p_num_places,
        'error', 'Capacité insuffisante'
      );
    ELSE
      -- Override : ajuster le remaining pour que le trigger décremente correctement
      UPDATE public.slots
      SET remaining_capacity = p_num_places
      WHERE id = p_slot_id;

      v_capacity_warning := TRUE;
    END IF;
  END IF;

  -- ============================================
  -- 5. Créer la réservation
  -- ============================================
  INSERT INTO public.reservations (
    slot_id,
    num_places,
    status,
    source,
    created_by_user_id,
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
    special_requests,
    checkin_venue_notes,
    checkin_internal_notes,
    checkin_status,
    checkin_at,
    checkin_by
  ) VALUES (
    p_slot_id,
    p_num_places,
    'confirmed',
    'admin',
    v_user_id,
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
    NULLIF(p_special_requests, ''),
    NULLIF(p_checkin_venue_notes, ''),
    NULLIF(p_checkin_internal_notes, ''),
    CASE WHEN p_checkin_status IS NOT NULL AND p_checkin_status != ''
      THEN p_checkin_status::TEXT ELSE NULL END,
    CASE WHEN p_checkin_status IS NOT NULL AND p_checkin_status != ''
      THEN NOW() ELSE NULL END,
    CASE WHEN p_checkin_status IS NOT NULL AND p_checkin_status != ''
      THEN v_user_id ELSE NULL END
  )
  RETURNING id INTO v_reservation_id;

  RETURN json_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'capacity_warning', v_capacity_warning
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.create_walkin_reservation IS
  'Crée une réservation walk-in depuis la PWA d''accueil. '
  'Accès externe : vérifié via slots.hosted_by_id (pattern migration 040). '
  'Override capacité : admin/super-admin uniquement (R-EXT-02).';

GRANT EXECUTE ON FUNCTION public.create_walkin_reservation TO authenticated;
