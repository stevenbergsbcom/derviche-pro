-- ============================================
-- Migration 130: Restaurer le rôle `company` dans create_admin_reservation
-- Derviche Diffusion
-- Date: 2026-07-11
-- ============================================
-- CONTEXTE (régression) :
-- La migration 032 (`allow_company_admin_reservation`) avait ajouté le rôle
-- `company` à `create_admin_reservation`, avec un scoping strict : une
-- compagnie ne peut créer une réservation que sur un créneau (a) d'un de SES
-- spectacles et (b) dont `hosted_by = 'company'` (elle assure l'accueil).
--
-- La migration 095 (`allow_duplicate_reservations`) a redéfini la fonction en
-- partant d'une base ANTÉRIEURE à la 032 : elle a silencieusement supprimé
-- TOUT le bloc compagnie (garde de rôle ET scoping). Depuis, une compagnie qui
-- fait son propre accueil ne peut plus ajouter un pro walk-in depuis la PWA :
--   « Accès non autorisé - rôle admin requis »  (message de la 095)
-- Constaté en prod sur le spectacle « Algorithme ». Retour client.
--
-- La 095 avait en revanche bien conservé `p_country` (065) et
-- `p_checkin_internal_notes` (067) → seul le bloc compagnie est à restaurer.
--
-- CORRECTION :
-- Base = version 095 (doublons email/slot autorisés, pays, notes checkin),
-- + restauration du bloc compagnie de la 032 :
--   - `company` réintégré à la garde de rôle
--   - scoping : slot appartenant à un spectacle de SA compagnie ET hosted_by='company'
--
-- DURCISSEMENTS au passage :
-- 1. `checkin_internal_notes` (notes internes Derviche) n'est JAMAIS écrit pour
--    une compagnie — règle métier constante du projet (« staff DD uniquement,
--    jamais les compagnies »). Le client ne les envoie déjà pas (ADMIN_ROLES
--    exclut company), c'est une défense en profondeur côté serveur.
-- 2. Le test d'existence du slot utilise `IF NOT FOUND` au lieu du
--    `EXISTS(...)` de la 032 : si le slot n'existait pas, les variables INTO
--    restaient NULL et `IF NOT v_slot_exists` (NULL) ne déclenchait PAS
--    l'erreur — bug latent corrigé ici.
--
-- PORTÉE : CREATE OR REPLACE de la fonction uniquement. Signature inchangée
-- (aucun impact sur les appelants TS). Rôles admin/super-admin/externe :
-- comportement strictement identique à la 095.
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
  -- Paramètres checkin
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
  v_user_id UUID;
  v_user_role TEXT;
  v_normalized_email TEXT;
  -- Restaurés depuis la migration 032 (scoping compagnie)
  v_user_company_id UUID;
  v_slot_company_id UUID;
  v_slot_hosted_by TEXT;
BEGIN
  -- ============================================
  -- 0. Normaliser l'email en minuscules
  -- ============================================
  v_normalized_email := LOWER(TRIM(p_email));

  -- ============================================
  -- 1. Vérifier que l'utilisateur est connecté
  -- ============================================
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Utilisateur non connecté');
  END IF;

  -- ============================================
  -- 2. Vérifier le rôle (super-admin, admin, externe OU company)
  --    `company` restauré (régressé par la 095)
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
  -- 3. Vérifier que le slot existe + récupérer les infos de scoping
  -- ============================================
  SELECT s.hosted_by, sh.company_id
  INTO v_slot_hosted_by, v_slot_company_id
  FROM public.slots s
  JOIN public.shows sh ON sh.id = s.show_id
  WHERE s.id = p_slot_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Créneau invalide ou inexistant');
  END IF;

  -- ============================================
  -- 4. Pour les compagnies : vérifier l'accès au créneau (restauré de la 032)
  --    (a) le spectacle appartient à SA compagnie
  --    (b) l'accueil de la représentation est bien assuré par la compagnie
  -- ============================================
  IF v_user_role = 'company' THEN
    SELECT company_id INTO v_user_company_id
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_user_company_id IS NULL
       OR v_slot_company_id IS NULL
       OR v_slot_company_id <> v_user_company_id THEN
      RETURN json_build_object('success', false, 'error', 'Accès non autorisé à ce créneau');
    END IF;

    IF v_slot_hosted_by IS DISTINCT FROM 'company' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'L''accueil de cette représentation n''est pas assuré par la compagnie'
      );
    END IF;
  END IF;

  -- ============================================
  -- 5. Créer la réservation avec source='admin'
  -- Note S184 : la vérification unicité email/slot est faite côté client
  -- avec confirmation utilisateur. Les doublons sont autorisés (base 095).
  -- Les triggers gèrent : spectacle publié, max_reservations_per_booking,
  -- capacité restante + décrémentation, garde de date (levée pour source
  -- 'admin' depuis la migration 128).
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
    -- Notes checkin
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
    -- Notes checkin
    NULLIF(p_checkin_comment, ''),
    NULLIF(p_checkin_venue_notes, ''),
    -- Notes internes Derviche : JAMAIS pour une compagnie (staff DD uniquement)
    CASE
      WHEN v_user_role = 'company' THEN NULL
      ELSE NULLIF(p_checkin_internal_notes, '')
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
      'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.create_admin_reservation IS
  'Crée une réservation depuis le back-office ou la PWA (source=admin). '
  'Rôles : super-admin, admin, externe — et company UNIQUEMENT sur les '
  'créneaux de ses propres spectacles dont hosted_by = ''company'' '
  '(restauré en migration 130 après régression de la 095). '
  'Doublons email/slot autorisés (S184). Les notes internes Derviche ne sont '
  'jamais enregistrées pour une compagnie. Traçabilité via created_by_user_id.';
