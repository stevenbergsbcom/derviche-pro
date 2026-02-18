-- ============================================
-- Migration 042: Fix create_public_reservation - set user_id when authenticated
-- Derviche Diffusion
-- Date: 2026-02-18
-- ============================================
-- PROBLÈME : La RPC create_public_reservation n'insérait jamais user_id,
-- même quand un professionnel connecté faisait une réservation.
-- Résultat : user_id = NULL → les réservations étaient invisibles dans le
-- dashboard pro (RLS : reservations_select_own → user_id = auth.uid()).
--
-- CORRECTION : auth.uid() est ajouté à l'INSERT.
-- - Si l'utilisateur est connecté → user_id = son UUID
-- - Si anonyme → auth.uid() retourne NULL, comportement guest inchangé
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
  -- auth.uid() est inclus : NULL si anonyme, UUID si connecté.
  -- Les triggers gèrent automatiquement :
  --   - Validation du spectacle publié
  --   - Vérification max_reservations_per_booking
  --   - Vérification capacité restante
  --   - Décrémentation de remaining_capacity
  -- ============================================
  INSERT INTO public.reservations (
    slot_id,
    user_id,         -- ← AJOUT : lie la réservation au compte si connecté
    num_places,
    status,
    -- Données guest (conservées même si connecté pour l'affichage check-in)
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
    auth.uid(),      -- ← NULL pour les anonymes, UUID pour les connectés
    p_num_places,
    'confirmed',
    -- Données guest
    p_first_name,
    p_last_name,
    LOWER(p_email),
    NULLIF(p_phone, ''),
    NULLIF(p_function, ''),
    NULLIF(p_organization, ''),
    NULLIF(p_email_secondary, ''),
    NULLIF(p_phone_secondary, ''),
    NULLIF(p_address, ''),
    NULLIF(p_postal_code, ''),
    NULLIF(p_city, ''),
    NULLIF(p_comment, '')
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

COMMENT ON FUNCTION public.create_public_reservation IS
  'Crée une réservation publique. Si l''utilisateur est connecté (auth.uid() non NULL),
   user_id est renseigné et la réservation apparaît dans son dashboard pro.
   Si anonyme, user_id = NULL (comportement guest inchangé).';

-- Les permissions restent identiques
GRANT EXECUTE ON FUNCTION public.create_public_reservation TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_reservation TO authenticated;
