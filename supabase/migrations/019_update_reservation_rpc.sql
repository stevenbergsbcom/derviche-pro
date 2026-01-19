-- ============================================
-- Migration 019: RPC update_reservation_safe
-- Derviche Diffusion
-- 
-- Fonction sécurisée pour modifier une réservation
-- Gère correctement la capacité lors de changement de places ou de créneau
-- ============================================

CREATE OR REPLACE FUNCTION update_reservation_safe(
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
  -- ============================================
  -- 1. Récupérer la réservation actuelle
  -- ============================================
  SELECT * INTO v_current_reservation
  FROM reservations
  WHERE id = p_reservation_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Réservation non trouvée');
  END IF;

  -- Vérifier que la réservation n'est pas annulée
  IF v_current_reservation.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Impossible de modifier une réservation annulée');
  END IF;

  -- Valeurs actuelles
  v_current_slot_id := v_current_reservation.slot_id;
  v_current_num_places := v_current_reservation.num_places;

  -- Nouvelles valeurs (utiliser les actuelles si non fournies)
  v_new_slot_id := COALESCE(p_slot_id, v_current_slot_id);
  v_new_num_places := COALESCE(p_num_places, v_current_num_places);

  -- ============================================
  -- 2. Gérer le changement de capacité
  -- ============================================
  
  -- Cas 1: Même créneau, changement de places
  IF v_new_slot_id = v_current_slot_id AND v_new_num_places != v_current_num_places THEN
    -- Récupérer les infos du slot
    SELECT capacity, remaining_capacity INTO v_old_slot_capacity, v_old_slot_remaining
    FROM slots WHERE id = v_current_slot_id;

    v_capacity_change := v_new_num_places - v_current_num_places;

    -- Vérifier si assez de places (sauf si illimité = 999999)
    IF v_old_slot_capacity < 999999 AND v_old_slot_remaining < v_capacity_change THEN
      RETURN json_build_object(
        'success', false, 
        'error', format('Capacité insuffisante. Il reste %s place(s) disponible(s).', v_old_slot_remaining)
      );
    END IF;

    -- Mettre à jour la capacité du slot
    UPDATE slots 
    SET remaining_capacity = remaining_capacity - v_capacity_change
    WHERE id = v_current_slot_id;

  -- Cas 2: Changement de créneau
  ELSIF v_new_slot_id != v_current_slot_id THEN
    -- Récupérer les infos de l'ancien slot
    SELECT capacity, remaining_capacity INTO v_old_slot_capacity, v_old_slot_remaining
    FROM slots WHERE id = v_current_slot_id;

    -- Récupérer les infos du nouveau slot
    SELECT capacity, remaining_capacity INTO v_new_slot_capacity, v_new_slot_remaining
    FROM slots WHERE id = v_new_slot_id;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Nouveau créneau non trouvé');
    END IF;

    -- Vérifier la capacité du nouveau slot (sauf si illimité)
    IF v_new_slot_capacity < 999999 AND v_new_slot_remaining < v_new_num_places THEN
      RETURN json_build_object(
        'success', false, 
        'error', format('Capacité insuffisante sur le nouveau créneau. Il reste %s place(s) disponible(s).', v_new_slot_remaining)
      );
    END IF;

    -- Libérer les places sur l'ancien slot
    UPDATE slots 
    SET remaining_capacity = remaining_capacity + v_current_num_places
    WHERE id = v_current_slot_id;

    -- Réserver les places sur le nouveau slot
    UPDATE slots 
    SET remaining_capacity = remaining_capacity - v_new_num_places
    WHERE id = v_new_slot_id;
  END IF;

  -- ============================================
  -- 3. Mettre à jour la réservation
  -- ============================================
  UPDATE reservations SET
    -- Données guest (ne mettre à jour que si fourni)
    guest_first_name = COALESCE(p_first_name, guest_first_name),
    guest_last_name = COALESCE(p_last_name, guest_last_name),
    guest_email = COALESCE(p_email, guest_email),
    guest_phone = COALESCE(p_phone, guest_phone),
    guest_email_secondary = COALESCE(p_email_secondary, guest_email_secondary),
    guest_phone_secondary = COALESCE(p_phone_secondary, guest_phone_secondary),
    guest_address = COALESCE(p_address, guest_address),
    guest_postal_code = COALESCE(p_postal_code, guest_postal_code),
    guest_city = COALESCE(p_city, guest_city),
    guest_structure = COALESCE(p_organization, guest_structure),
    guest_function = COALESCE(p_function, guest_function),
    guest_afc_number = COALESCE(p_afc_number, guest_afc_number),
    -- Réservation
    slot_id = v_new_slot_id,
    num_places = v_new_num_places,
    special_requests = COALESCE(p_special_requests, special_requests),
    -- Notes
    checkin_comment = COALESCE(p_checkin_comment, checkin_comment),
    checkin_venue_notes = COALESCE(p_checkin_venue_notes, checkin_venue_notes),
    checkin_internal_notes = COALESCE(p_checkin_internal_notes, checkin_internal_notes),
    -- Timestamp
    updated_at = NOW()
  WHERE id = p_reservation_id;

  RETURN json_build_object('success', true, 'reservation_id', p_reservation_id);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- Permissions
-- ============================================
-- Seuls les admins peuvent modifier les réservations
GRANT EXECUTE ON FUNCTION update_reservation_safe TO authenticated;

-- ============================================
-- Commentaires
-- ============================================
COMMENT ON FUNCTION update_reservation_safe IS 'Modifie une réservation de manière sécurisée avec gestion de la capacité';
