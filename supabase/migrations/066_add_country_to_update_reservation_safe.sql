-- ============================================
-- Migration 066: Ajout p_country à update_reservation_safe
-- Derviche Diffusion
-- Date: 2026-03-05
-- ============================================
-- Supprime toutes les signatures existantes (ambiguïté)
-- puis recrée une version unique avec p_country
-- ============================================

-- Signatures connues (migrations 019 et 045)
-- 19 params : sans p_country
DROP FUNCTION IF EXISTS public.update_reservation_safe(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, UUID, TEXT, TEXT, TEXT, TEXT);
-- 20 params : avec p_country (si déjà créée partiellement)
DROP FUNCTION IF EXISTS public.update_reservation_safe(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, UUID, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.update_reservation_safe(
  p_reservation_id UUID,
  -- Données guest
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
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
  -- Réservation
  p_num_places INTEGER DEFAULT NULL,
  p_slot_id UUID DEFAULT NULL,
  p_special_requests TEXT DEFAULT NULL,
  -- Notes
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
  v_current_reservation reservations%ROWTYPE;
  v_current_slot_id UUID;
  v_current_num_places INTEGER;
  v_new_slot_id UUID;
  v_new_num_places INTEGER;
  v_old_slot_capacity INTEGER;
  v_old_slot_remaining INTEGER;
  v_new_slot_capacity INTEGER;
  v_new_slot_remaining INTEGER;
  v_capacity_change INTEGER;
BEGIN
  -- 1. Récupérer la réservation actuelle
  SELECT * INTO v_current_reservation
  FROM reservations
  WHERE id = p_reservation_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Réservation non trouvée');
  END IF;

  IF v_current_reservation.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Impossible de modifier une réservation annulée');
  END IF;

  v_current_slot_id := v_current_reservation.slot_id;
  v_current_num_places := v_current_reservation.num_places;
  v_new_slot_id := COALESCE(p_slot_id, v_current_slot_id);
  v_new_num_places := COALESCE(p_num_places, v_current_num_places);

  -- 2. Gérer le changement de capacité
  IF v_new_slot_id = v_current_slot_id AND v_new_num_places != v_current_num_places THEN
    SELECT capacity, remaining_capacity INTO v_old_slot_capacity, v_old_slot_remaining
    FROM slots WHERE id = v_current_slot_id;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Créneau actuel non trouvé');
    END IF;

    v_capacity_change := v_new_num_places - v_current_num_places;

    IF v_old_slot_capacity < 999999 AND v_old_slot_remaining < v_capacity_change THEN
      RETURN json_build_object(
        'success', false,
        'error', format('Capacité insuffisante. Il reste %s place(s) disponible(s).', v_old_slot_remaining)
      );
    END IF;

    IF v_old_slot_capacity < 999999 THEN
      UPDATE slots
      SET remaining_capacity = remaining_capacity - v_capacity_change
      WHERE id = v_current_slot_id;
    END IF;

  ELSIF v_new_slot_id != v_current_slot_id THEN
    SELECT capacity, remaining_capacity INTO v_old_slot_capacity, v_old_slot_remaining
    FROM slots WHERE id = v_current_slot_id;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Créneau actuel non trouvé');
    END IF;

    SELECT capacity, remaining_capacity INTO v_new_slot_capacity, v_new_slot_remaining
    FROM slots WHERE id = v_new_slot_id;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Nouveau créneau non trouvé');
    END IF;

    IF v_new_slot_capacity < 999999 AND v_new_slot_remaining < v_new_num_places THEN
      RETURN json_build_object(
        'success', false,
        'error', format('Capacité insuffisante sur le nouveau créneau. Il reste %s place(s) disponible(s).', v_new_slot_remaining)
      );
    END IF;

    IF v_old_slot_capacity < 999999 THEN
      UPDATE slots
      SET remaining_capacity = remaining_capacity + v_current_num_places
      WHERE id = v_current_slot_id;
    END IF;

    IF v_new_slot_capacity < 999999 THEN
      UPDATE slots
      SET remaining_capacity = remaining_capacity - v_new_num_places
      WHERE id = v_new_slot_id;
    END IF;
  END IF;

  -- 3. Mettre à jour la réservation
  -- Convention: NULL = ne pas modifier, '' = effacer, 'valeur' = mettre à jour
  UPDATE reservations SET
    guest_first_name = CASE
      WHEN p_first_name IS NULL THEN guest_first_name
      WHEN p_first_name = '' THEN NULL
      ELSE p_first_name
    END,
    guest_last_name = CASE
      WHEN p_last_name IS NULL THEN guest_last_name
      WHEN p_last_name = '' THEN NULL
      ELSE p_last_name
    END,
    guest_email = CASE
      WHEN p_email IS NULL THEN guest_email
      WHEN p_email = '' THEN NULL
      ELSE p_email
    END,
    guest_phone = CASE
      WHEN p_phone IS NULL THEN guest_phone
      WHEN p_phone = '' THEN NULL
      ELSE p_phone
    END,
    guest_email_secondary = CASE
      WHEN p_email_secondary IS NULL THEN guest_email_secondary
      WHEN p_email_secondary = '' THEN NULL
      ELSE p_email_secondary
    END,
    guest_phone_secondary = CASE
      WHEN p_phone_secondary IS NULL THEN guest_phone_secondary
      WHEN p_phone_secondary = '' THEN NULL
      ELSE p_phone_secondary
    END,
    guest_address = CASE
      WHEN p_address IS NULL THEN guest_address
      WHEN p_address = '' THEN NULL
      ELSE p_address
    END,
    guest_postal_code = CASE
      WHEN p_postal_code IS NULL THEN guest_postal_code
      WHEN p_postal_code = '' THEN NULL
      ELSE p_postal_code
    END,
    guest_city = CASE
      WHEN p_city IS NULL THEN guest_city
      WHEN p_city = '' THEN NULL
      ELSE p_city
    END,
    guest_country = CASE
      WHEN p_country IS NULL THEN guest_country
      WHEN p_country = '' THEN NULL
      ELSE p_country
    END,
    guest_structure = CASE
      WHEN p_organization IS NULL THEN guest_structure
      WHEN p_organization = '' THEN NULL
      ELSE p_organization
    END,
    guest_function = CASE
      WHEN p_function IS NULL THEN guest_function
      WHEN p_function = '' THEN NULL
      ELSE p_function
    END,
    guest_afc_number = CASE
      WHEN p_afc_number IS NULL THEN guest_afc_number
      WHEN p_afc_number = '' THEN NULL
      ELSE p_afc_number
    END,
    slot_id = v_new_slot_id,
    num_places = v_new_num_places,
    special_requests = CASE
      WHEN p_special_requests IS NULL THEN special_requests
      WHEN p_special_requests = '' THEN NULL
      ELSE p_special_requests
    END,
    checkin_comment = CASE
      WHEN p_checkin_comment IS NULL THEN checkin_comment
      WHEN p_checkin_comment = '' THEN NULL
      ELSE p_checkin_comment
    END,
    checkin_venue_notes = CASE
      WHEN p_checkin_venue_notes IS NULL THEN checkin_venue_notes
      WHEN p_checkin_venue_notes = '' THEN NULL
      ELSE p_checkin_venue_notes
    END,
    checkin_internal_notes = CASE
      WHEN p_checkin_internal_notes IS NULL THEN checkin_internal_notes
      WHEN p_checkin_internal_notes = '' THEN NULL
      ELSE p_checkin_internal_notes
    END,
    updated_at = NOW()
  WHERE id = p_reservation_id;

  RETURN json_build_object('success', true, 'reservation_id', p_reservation_id);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_reservation_safe TO authenticated;

COMMENT ON FUNCTION public.update_reservation_safe IS
  'Modifie une réservation de manière sécurisée avec gestion de la capacité. Migration 066 : ajout guest_country, suppression des overloads ambigus.';
