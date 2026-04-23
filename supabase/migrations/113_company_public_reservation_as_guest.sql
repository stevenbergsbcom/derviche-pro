-- ============================================
-- Migration 113: Compagnie connectée → réservation publique en mode guest
-- Derviche Diffusion
-- Date: 2026-04-23
-- ============================================
-- CONTEXTE :
--   Une compagnie peut recevoir un coup de téléphone d'un professionnel
--   qui souhaite réserver. Elle ouvre alors le catalogue public pour
--   saisir la réservation au nom du pro. Si elle est restée connectée
--   sur son compte `company`, la RPC `create_public_reservation` (092)
--   lie automatiquement la résa à son `auth.uid()` → mauvaise attribution.
--
-- DÉCISION PRODUIT :
--   Quand `auth.uid()` a le rôle `company` au moment d'un INSERT via
--   `create_public_reservation`, on force :
--     - user_id             = NULL              (mode guest)
--     - created_by_user_id  = auth.uid()         (traçabilité)
--     - source              = 'public' (inchangé, ça vient du site public)
--
--   Le front affiche un bandeau info pour signaler ce comportement.
--   Côté admin, un badge « Saisie par [Compagnie] » est déduit du
--   `created_by_user_id` + jointure profile.company_id.
--
-- AUCUN CHANGEMENT :
--   - signature de la fonction (mêmes paramètres)
--   - blocage admins (L52-62 de la 092)
--   - validations, verrou FOR UPDATE, trigger de capacité
--   - permissions GRANT
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
  p_country TEXT DEFAULT NULL,
  p_organization TEXT DEFAULT NULL,
  p_function TEXT DEFAULT NULL,
  p_afc_number TEXT DEFAULT NULL,
  p_comment TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation_id UUID;
  v_current_user_id UUID;
  v_created_by UUID;
  v_user_role TEXT;
  v_slot_remaining INTEGER;
  v_slot_capacity INTEGER;
  v_email_regex TEXT := '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
BEGIN
  -- ============================================
  -- 0. SÉCURITÉ : Bloquer les admins du formulaire public
  --    + coercion guest pour les compagnies
  -- ============================================
  v_current_user_id := auth.uid();
  v_created_by := NULL;

  IF v_current_user_id IS NOT NULL THEN
    SELECT role INTO v_user_role
    FROM public.user_roles
    WHERE user_id = v_current_user_id;

    IF v_user_role IN ('super-admin', 'admin', 'externe') THEN
      RAISE EXCEPTION 'Les administrateurs ne peuvent pas réserver via le formulaire public. Veuillez utiliser l''interface d''administration.';
    END IF;

    -- NOUVEAU (migration 113) :
    -- Une compagnie connectée qui réserve depuis le public le fait
    -- nécessairement au nom d'un tiers (typiquement un pro au téléphone).
    -- → on force le mode guest (user_id = NULL) et on trace la compagnie
    --   qui a saisi via created_by_user_id.
    IF v_user_role = 'company' THEN
      v_created_by := v_current_user_id;
      v_current_user_id := NULL;
    END IF;
  END IF;

  -- ============================================
  -- 1. VALIDATION : Champs obligatoires
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
  -- 2. VALIDATION : Format email
  -- ============================================
  IF NOT TRIM(p_email) ~* v_email_regex THEN
    RAISE EXCEPTION 'Format d''email invalide';
  END IF;

  IF p_email_secondary IS NOT NULL AND TRIM(p_email_secondary) != '' THEN
    IF NOT TRIM(p_email_secondary) ~* v_email_regex THEN
      RAISE EXCEPTION 'Format d''email secondaire invalide';
    END IF;
  END IF;

  -- ============================================
  -- 3. VALIDATION : Longueur des champs
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

  IF p_country IS NOT NULL AND LENGTH(p_country) > 100 THEN
    RAISE EXCEPTION 'Le pays ne peut pas dépasser 100 caractères';
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
  -- 4. VALIDATION : Nombre de places
  -- ============================================
  IF p_num_places IS NULL OR p_num_places < 1 THEN
    RAISE EXCEPTION 'Le nombre de places doit être au minimum 1';
  END IF;

  IF p_num_places > 20 THEN
    RAISE EXCEPTION 'Le nombre de places ne peut pas dépasser 20 par réservation';
  END IF;

  -- ============================================
  -- 5. VERROU ATOMIQUE : SELECT ... FOR UPDATE sur le slot
  -- ============================================
  SELECT remaining_capacity, capacity
  INTO v_slot_remaining, v_slot_capacity
  FROM public.slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Créneau invalide ou inexistant';
  END IF;

  -- Vérification capacité (999999 = illimité)
  IF v_slot_capacity < 999999 AND v_slot_remaining < p_num_places THEN
    RAISE EXCEPTION 'CAPACITY_FULL:% place(s) restante(s)', v_slot_remaining;
  END IF;

  -- ============================================
  -- 6. Créer la réservation
  --    - user_id           : NULL si company, auth.uid() si pro, NULL si anonyme
  --    - created_by_user_id : UUID compagnie si company, NULL sinon
  --    - source            : 'public' (inchangé)
  -- ============================================
  INSERT INTO public.reservations (
    slot_id,
    user_id,
    created_by_user_id,
    num_places,
    status,
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
    special_requests
  ) VALUES (
    p_slot_id,
    v_current_user_id,
    v_created_by,
    p_num_places,
    'confirmed',
    TRIM(p_first_name),
    TRIM(p_last_name),
    LOWER(TRIM(p_email)),
    NULLIF(TRIM(COALESCE(p_phone, '')), ''),
    NULLIF(TRIM(COALESCE(p_function, '')), ''),
    NULLIF(TRIM(COALESCE(p_organization, '')), ''),
    NULLIF(TRIM(COALESCE(p_afc_number, '')), ''),
    NULLIF(LOWER(TRIM(COALESCE(p_email_secondary, ''))), ''),
    NULLIF(TRIM(COALESCE(p_phone_secondary, '')), ''),
    NULLIF(TRIM(COALESCE(p_address, '')), ''),
    NULLIF(TRIM(COALESCE(p_postal_code, '')), ''),
    NULLIF(TRIM(COALESCE(p_city, '')), ''),
    NULLIF(TRIM(COALESCE(p_country, '')), ''),
    NULLIF(TRIM(COALESCE(p_comment, '')), '')
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Commentaire mis à jour (traçabilité compagnie)
COMMENT ON FUNCTION public.create_public_reservation IS
  'Crée une réservation avec verrou atomique (FOR UPDATE avant INSERT). '
  'Bloque les admins. Pour les utilisateurs company, force le mode guest '
  '(user_id = NULL, created_by_user_id = auth.uid()) — la résa est '
  'enregistrée au nom du pro saisi dans le formulaire. '
  'Retourne CAPACITY_FULL:N si le créneau est complet. Inclut p_country.';

-- Permissions inchangées
GRANT EXECUTE ON FUNCTION public.create_public_reservation TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_reservation TO authenticated;
