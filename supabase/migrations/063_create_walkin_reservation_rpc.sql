-- ============================================
-- Migration 063: Create walk-in reservation RPC function
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-03-05
-- ============================================
-- Cette fonction permet aux admin/externe de créer des réservations
-- on-the-spot depuis la PWA d'accueil.
--
-- Différences avec create_admin_reservation :
--   - Supporte checkin_status à la création (accueil immédiat)
--   - Supporte override_capacity pour forcer sur un créneau complet
--     (admin/super-admin uniquement, pas externe)
--   - Vérifie l'assignation show pour les externes (sécurité R-EXT-01)
--   - Retourne remaining_capacity pour avertissement côté client
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
  -- 3. Vérification assignation pour l'externe
  -- ============================================
  IF v_user_role = 'externe' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_show_assignments
      WHERE user_id = v_user_id
        AND show_id = v_slot_show_id
    ) INTO v_is_assigned;

    IF NOT v_is_assigned THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Accès refusé - spectacle non assigné'
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
      -- Retourner un avertissement sans créer la réservation
      RETURN json_build_object(
        'success', false,
        'capacity_warning', true,
        'remaining', v_slot_remaining,
        'requested', p_num_places,
        'error', 'Capacité insuffisante'
      );
    ELSE
      -- Override : ajuster temporairement le remaining pour que le trigger passe
      -- Le trigger décrementera de p_num_places, résultat = 0 (ou nul si overbooking déjà géré)
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
    checkin_venue_notes,
    checkin_internal_notes,
    -- Check-in optionnel
    checkin_status,
    checkin_at,
    checkin_by
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
    -- Notes
    NULLIF(p_special_requests, ''),
    NULLIF(p_checkin_venue_notes, ''),
    NULLIF(p_checkin_internal_notes, ''),
    -- Check-in : NULL si non fourni, sinon valeur + timestamp + auteur
    CASE WHEN p_checkin_status IS NOT NULL AND p_checkin_status != ''
      THEN p_checkin_status::TEXT
      ELSE NULL
    END,
    CASE WHEN p_checkin_status IS NOT NULL AND p_checkin_status != ''
      THEN NOW()
      ELSE NULL
    END,
    CASE WHEN p_checkin_status IS NOT NULL AND p_checkin_status != ''
      THEN v_user_id
      ELSE NULL
    END
  )
  RETURNING id INTO v_reservation_id;

  RETURN json_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'capacity_warning', v_capacity_warning
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.create_walkin_reservation IS
  'Crée une réservation walk-in depuis la PWA d''accueil. '
  'Supporte le check-in immédiat à la création et l''override capacité (admin/super-admin uniquement). '
  'Vérifie l''assignation show pour les externes (R-EXT-01).';

-- Permissions
GRANT EXECUTE ON FUNCTION public.create_walkin_reservation TO authenticated;
