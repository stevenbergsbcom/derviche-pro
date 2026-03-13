-- ============================================
-- Migration 095 : Autoriser les doublons de réservation email+créneau
-- Derviche Diffusion — Derviche Pro
-- Date: 2026-03-13
-- Session: S184
--
-- CHANGEMENT DE RÈGLE MÉTIER :
--   Ancienne règle R-RESA-04 : un email ne peut avoir qu'une seule
--   réservation active par créneau (blocage strict).
--   Nouvelle règle : affichage d'un avertissement côté client si
--   doublon détecté, mais création autorisée après confirmation.
--
-- ACTIONS :
--   1. Remplacer les index UNIQUE par des index réguliers (perf)
--   2. Retirer le check doublon dans create_admin_reservation
--   3. Créer RPC check_reservation_duplicate (vérif côté client)
-- ============================================

-- ============================================
-- 1. Remplacer les index UNIQUE par des index réguliers
-- ============================================

-- 1a. Index guest_email + slot_id
DROP INDEX IF EXISTS public.idx_unique_reservation_guest_slot;

CREATE INDEX idx_reservation_guest_slot
  ON public.reservations (guest_email, slot_id)
  WHERE guest_email IS NOT NULL AND status != 'cancelled';

COMMENT ON INDEX public.idx_reservation_guest_slot IS
  'Index de performance pour la recherche de réservations par email + créneau.
   Non-unique : les doublons sont autorisés avec avertissement côté client (S184).';

-- 1b. Index user_id + slot_id
DROP INDEX IF EXISTS public.idx_unique_reservation_user_slot;

CREATE INDEX idx_reservation_user_slot
  ON public.reservations (user_id, slot_id)
  WHERE status != 'cancelled' AND user_id IS NOT NULL;

COMMENT ON INDEX public.idx_reservation_user_slot IS
  'Index de performance pour la recherche de réservations par utilisateur + créneau.
   Non-unique : les doublons sont autorisés avec avertissement côté client (S184).';

-- ============================================
-- 2. Recréer create_admin_reservation SANS le check doublon
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
  -- Paramètres checkin (admin uniquement)
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
  v_normalized_email TEXT;
BEGIN
  -- ============================================
  -- 0. Normaliser l'email en minuscules
  -- ============================================
  v_normalized_email := LOWER(TRIM(p_email));

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
  -- Note S184 : la vérification unicité email/slot (ex R-RESA-04)
  -- est désormais faite côté client avec confirmation utilisateur.
  -- Les doublons sont autorisés après avertissement.
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
    guest_country,
    -- Commentaire
    special_requests,
    -- Notes checkin (admin)
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
    v_normalized_email,
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
    -- Commentaire
    NULLIF(p_comment, ''),
    -- Notes checkin (admin)
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

COMMENT ON FUNCTION public.create_admin_reservation IS
  'Crée une réservation depuis le back-office admin. Doublons email/slot autorisés (S184). Requiert un rôle admin.';

-- ============================================
-- 3. Créer RPC check_reservation_duplicate
--    Callable par anon + authenticated (SECURITY DEFINER bypass RLS)
--    Utilisée côté client pour afficher un avertissement avant création
-- ============================================

CREATE OR REPLACE FUNCTION public.check_reservation_duplicate(
  p_slot_id UUID,
  p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_normalized_email TEXT;
BEGIN
  v_normalized_email := LOWER(TRIM(p_email));

  SELECT id, guest_first_name, guest_last_name, num_places
  INTO v_existing
  FROM public.reservations
  WHERE slot_id = p_slot_id
    AND LOWER(guest_email) = v_normalized_email
    AND status != 'cancelled'
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN json_build_object(
      'hasDuplicate', true,
      'firstName', v_existing.guest_first_name,
      'lastName', v_existing.guest_last_name,
      'numPlaces', v_existing.num_places
    );
  END IF;

  RETURN json_build_object('hasDuplicate', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_reservation_duplicate(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_reservation_duplicate(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.check_reservation_duplicate IS
  'Vérifie si un email a déjà une réservation active sur un créneau donné.
   Retourne les infos de la réservation existante le cas échéant.
   SECURITY DEFINER : accessible par anon (formulaire public) et authenticated.
   S184 : utilisée côté client pour avertissement non-bloquant.';
