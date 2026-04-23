-- ============================================
-- Migration 114: Fail-safe pour rôle NULL + clarification commentaire
-- Derviche Diffusion
-- Date: 2026-04-23
-- ============================================
-- AUDIT CURSOR (post-113) :
--   Si un utilisateur authentifié n'a AUCUNE ligne dans `user_roles`
--   (corruption, nouveau signup pas encore assigné, etc.), la 113 :
--     - ne bloque pas (pas dans les rôles admin)
--     - ne coerce pas en guest (pas rôle 'company')
--     → `user_id = auth.uid()` est conservé dans l'INSERT
--   Résultat : la réservation est liée à un compte « fantôme » sans rôle,
--   ce qui peut induire en erreur les requêtes métier côté admin
--   (ex. liste des pros actifs, stats de réservation, etc.).
--
-- CORRECTION (fail-safe) :
--   Si `v_user_role IS NULL` alors qu'un utilisateur est connecté, on force
--   la réservation en mode guest strict :
--     - user_id = NULL
--     - created_by_user_id = NULL (pas de traçabilité pour un rôle inconnu)
--   C'est un comportement sûr par défaut (on n'attribue rien plutôt que
--   d'attribuer à un fantôme). Les champs `guest_*` saisis dans le formulaire
--   restent corrects — la réservation n'est juste plus liée à un compte.
--
-- BONUS :
--   Clarification du COMMENT ON FUNCTION : préciser explicitement que le
--   couple `(user_id = NULL, created_by_user_id = auth.uid())` ne s'applique
--   qu'au rôle `company` (et à lui seul).
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
  -- 0. SÉCURITÉ : Bloquer les admins + coercion guest pour compagnie
  --    + fail-safe pour rôle inconnu (fix audit 114)
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

    IF v_user_role = 'company' THEN
      -- Compagnie connectée : réservation au nom d'un tiers (cf. 113).
      -- user_id = NULL + trace via created_by_user_id.
      v_created_by := v_current_user_id;
      v_current_user_id := NULL;
    ELSIF v_user_role IS NULL THEN
      -- Fail-safe (migration 114) : authentifié MAIS sans ligne dans
      -- user_roles → on refuse d'attribuer la résa à ce compte. Mode
      -- guest strict, sans traçabilité (rôle inconnu = pas d'identité
      -- métier fiable pour le badge admin).
      v_current_user_id := NULL;
    END IF;
    -- Sinon (`professional`) : comportement normal, user_id = auth.uid()
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

  IF v_slot_capacity < 999999 AND v_slot_remaining < p_num_places THEN
    RAISE EXCEPTION 'CAPACITY_FULL:% place(s) restante(s)', v_slot_remaining;
  END IF;

  -- ============================================
  -- 6. Créer la réservation
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

-- Commentaire clarifié (audit 114) : préciser explicitement que le
-- couple (user_id = NULL, created_by_user_id = auth.uid()) est réservé
-- au rôle `company` et à lui seul.
COMMENT ON FUNCTION public.create_public_reservation IS
  'Crée une réservation avec verrou atomique (FOR UPDATE avant INSERT). '
  'Règles d''attribution user_id / created_by_user_id : '
  '- Anonyme        → user_id = NULL,  created_by_user_id = NULL. '
  '- Pro connecté  → user_id = auth.uid(), created_by_user_id = NULL. '
  '- Company       → user_id = NULL, created_by_user_id = auth.uid() '
  '                   (résa saisie par la compagnie au nom d''un pro). '
  '- Admin         → BLOQUÉ (RAISE EXCEPTION). '
  '- Rôle inconnu  → user_id = NULL, created_by_user_id = NULL (fail-safe). '
  'Retourne CAPACITY_FULL:N si le créneau est complet. Inclut p_country.';

-- Permissions inchangées
GRANT EXECUTE ON FUNCTION public.create_public_reservation TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_reservation TO authenticated;
