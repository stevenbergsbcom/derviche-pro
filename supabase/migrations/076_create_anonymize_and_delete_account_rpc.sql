-- ============================================
-- Migration 076: RPC anonymize_and_delete_account
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-03-09
-- ============================================
-- RGPD — Droit à l'effacement (Art. 17 RGPD)
--
-- Cette RPC est appelée depuis la route API /api/professional/delete-account
-- AVANT l'appel à supabase.auth.admin.deleteUser côté Node.js.
--
-- SÉQUENCE D'EXÉCUTION :
--   1. Vérifier que l'utilisateur connecté est bien le propriétaire du compte
--   2. Vérifier que le rôle est 'professional' (pas d'auto-suppression admin)
--   3. Récupérer l'email du profil (pour anonymiser les réservations guest)
--   4. Annuler les réservations futures (date >= aujourd'hui, status != 'cancelled')
--   5. Anonymiser les PII sur TOUTES les réservations liées à ce compte
--      (user_id OU guest_email correspondant)
--   6. Retourner : success, count des réservations annulées, leurs IDs, l'email
--      (pour que la route API puisse créer la notification admin)
--
-- APRÈS la RPC, la route API appelle auth.admin.deleteUser :
--   → supprime la ligne dans auth.users
--   → CASCADE : supprime le profil dans public.profiles
--   → ON DELETE SET NULL : user_id devient NULL sur les réservations
--      (préservation des stats métier sans PII)
--
-- OPTION A (choisie) : anonymisation totale
--   - Données guest sur les réservations → anonymisées
--   - Réservations passées → conservées avec user_id NULL (stats préservées)
--   - Réservations futures → annulées
--   - Profil → supprimé par cascade lors de auth.admin.deleteUser
-- ============================================

CREATE OR REPLACE FUNCTION public.anonymize_and_delete_account()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_email TEXT;
  v_today DATE := CURRENT_DATE;
  v_cancelled_ids UUID[];
  v_cancelled_count INTEGER := 0;
  v_anon_email TEXT;
BEGIN
  -- ============================================
  -- 1. Vérifier que l'utilisateur est connecté
  -- ============================================
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Utilisateur non connecté');
  END IF;

  -- ============================================
  -- 2. Vérifier le rôle — uniquement 'professional'
  --    Les comptes admin/externe ne peuvent pas
  --    s'auto-supprimer via cette route.
  -- ============================================
  SELECT role INTO v_user_role
  FROM public.user_roles
  WHERE user_id = v_user_id;

  IF v_user_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Rôle introuvable');
  END IF;

  IF v_user_role != 'professional' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Seuls les comptes professionnels peuvent supprimer leur compte via cette interface'
    );
  END IF;

  -- ============================================
  -- 3. Récupérer l'email du profil
  --    (pour anonymiser aussi les réservations guest)
  -- ============================================
  SELECT email INTO v_user_email
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profil introuvable');
  END IF;

  -- Email anonymisé : préfixe + 12 chars du hash MD5(user_id + email) + domaine fictif
  -- Combine user_id + email pour réduire le risque de collision (2^48 combinaisons)
  -- Format : deleted-a1b2c3d4e5f6@anonyme.local
  v_anon_email := 'deleted-' || LEFT(MD5(v_user_id::TEXT || v_user_email), 12) || '@anonyme.local';

  -- ============================================
  -- 4. Annuler les réservations FUTURES (date >= aujourd'hui)
  --    Exclure les déjà annulées.
  --    Récupérer leurs IDs pour la notification admin.
  -- ============================================
  WITH future_to_cancel AS (
    UPDATE public.reservations r
    SET
      status           = 'cancelled',
      cancelled_at     = NOW(),
      cancellation_reason = 'Compte supprimé par le titulaire (RGPD)'
    FROM public.slots s
    WHERE r.slot_id = s.id
      AND s.date >= v_today
      AND r.status != 'cancelled'
      AND (
        r.user_id = v_user_id
        OR LOWER(r.guest_email) = LOWER(v_user_email)
      )
    RETURNING r.id
  )
  SELECT
    ARRAY_AGG(id),
    COUNT(*)
  INTO
    v_cancelled_ids,
    v_cancelled_count
  FROM future_to_cancel;

  -- Sécurité : normaliser si aucune réservation annulée
  v_cancelled_ids   := COALESCE(v_cancelled_ids, ARRAY[]::UUID[]);
  v_cancelled_count := COALESCE(v_cancelled_count, 0);

  -- ============================================
  -- 5. Anonymiser les PII sur TOUTES les réservations
  --    (passées ET futures, liées par user_id OU guest_email)
  --    On anonymise même les futures déjà annulées à l'étape 4,
  --    pour garantir zéro PII en base après la suppression du compte.
  -- ============================================
  UPDATE public.reservations
  SET
    guest_first_name    = 'Professionnel',
    guest_last_name     = 'Supprimé',
    guest_email         = v_anon_email,
    guest_phone         = NULL,
    guest_phone_secondary = NULL,
    guest_email_secondary = NULL,
    guest_address       = NULL,
    guest_postal_code   = NULL,
    guest_city          = NULL,
    guest_country       = NULL,
    guest_structure        = NULL,
    guest_function         = NULL,
    guest_afc_number       = NULL,
    special_requests       = NULL,
    checkin_internal_notes = NULL,  -- peut contenir des PII (notes sur la personne)
    updated_at             = NOW()
  WHERE
    user_id = v_user_id
    OR LOWER(guest_email) = LOWER(v_user_email);

  -- ============================================
  -- 6. Retourner le résultat
  --    La route API utilisera :
  --      - cancelled_count pour décider d'envoyer une notif admin
  --      - user_email pour le message de notification
  -- ============================================
  RETURN json_build_object(
    'success',          true,
    'cancelled_count',  v_cancelled_count,
    'cancelled_ids',    v_cancelled_ids,
    'user_email',       v_user_email
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error',   SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.anonymize_and_delete_account IS
  'RGPD Art. 17 — Anonymise les PII et annule les réservations futures du compte connecté (role: professional uniquement). '
  'À appeler AVANT auth.admin.deleteUser depuis la route API /api/professional/delete-account.';

-- Seul l'utilisateur connecté peut appeler cette fonction sur son propre compte
-- (vérifié en interne via auth.uid())
GRANT EXECUTE ON FUNCTION public.anonymize_and_delete_account TO authenticated;
