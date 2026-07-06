-- ============================================
-- Migration 126: RPC search_company_reservation_ids — recherche compagnie
-- Derviche Diffusion
-- Date: 2026-07-06
-- ============================================
-- CONTEXTE :
-- La recherche du dashboard /company/reservations souffre du même bug que
-- la version admin (migration 125) : elle ne cherche que dans 3 colonnes
-- guest_* et rate donc toutes les résa de pros connectés.
--
-- DIFFÉRENCE AVEC LA VERSION ADMIN :
-- La RLS interdit à une compagnie de voir les données des profils des
-- pros (métier : la compagnie a le droit métier au check-in de SES
-- représentations, pas d'accès aux fichiers pro globaux). On restreint
-- donc la recherche aux colonnes guest_* de la table reservations.
--
-- ARBORESCENCE DES COLONNES CHERCHÉES :
--   Toutes les résas (guest ou pro connecté) — via les guest_* stockées
--   à la création de la résa :
--     - reservations.guest_email
--     - reservations.guest_first_name
--     - reservations.guest_last_name
--     - reservations.guest_phone
--     - reservations.guest_structure
--     - reservations.guest_email_secondary
--     - reservations.guest_phone_secondary
--     - reservations.crm_id
--     - reservations.crm_structure_id
--
-- NB : les guest_* de résa pro connecté sont NULL. Cette RPC ne résoudra
-- donc PAS 100% des cas côté compagnie. C'est une limite métier assumée
-- (voir la doc). Solution long terme : backfill/dénormalisation, à
-- discuter séparément — hors scope de ce fix.
--
-- MULTI-TOKENS : chaque token doit matcher au moins une colonne.
--
-- PÉRIMÈTRE PAR RÔLE :
-- - company : uniquement les résa de ses spectacles (via shows.company_id).
-- - Vérification : auth.uid() a bien le rôle 'company' et son
--   profile.company_id correspond aux résas retournées.
-- - Autres rôles : rejeté.
--
-- SÉCURITÉ :
-- - SECURITY DEFINER pour opérer sans être bloqué par RLS
-- - GRANT EXECUTE réservé aux users authentifiés
-- - Filtre par company_id du user connecté → aucune fuite cross-compagnie
-- ============================================

CREATE OR REPLACE FUNCTION public.search_company_reservation_ids(
  p_term TEXT
)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_company_id UUID;
  v_tokens TEXT[];
  v_token TEXT;
  v_ids UUID[];
  v_sql TEXT;
  v_where_and TEXT[];
  v_all_where TEXT;
  -- Plafond de résultats (cf. migration 125 + mémoire projet
  -- « recherche-in-url-limit »). Le service applique .in('id', ids) en GET,
  -- l'URL doit rester bornée. ⚠ Garder synchro avec SEARCH_RESULT_CAP (TS).
  v_cap CONSTANT INTEGER := 200;
BEGIN
  -- ============================================
  -- 1. Authentification + rôle + company_id
  -- ============================================
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'company' THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  SELECT company_id INTO v_company_id
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_company_id IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  -- ============================================
  -- 2. Sanitize + split en tokens
  -- ============================================
  p_term := REGEXP_REPLACE(TRIM(COALESCE(p_term, '')), '[%_\\]', ' ', 'g');
  p_term := REGEXP_REPLACE(p_term, '\s+', ' ', 'g');

  IF p_term = '' THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  v_tokens := STRING_TO_ARRAY(p_term, ' ');

  -- ============================================
  -- 3. Construire dynamiquement le WHERE
  -- ============================================
  v_where_and := ARRAY[]::TEXT[];

  FOREACH v_token IN ARRAY v_tokens LOOP
    -- Ignore les tokens < 2 caractères (aligne avec le min front).
    IF LENGTH(v_token) < 2 THEN CONTINUE; END IF;

    v_where_and := v_where_and || FORMAT($fmt$
      (
        r.guest_email          ILIKE %1$L OR
        r.guest_first_name     ILIKE %1$L OR
        r.guest_last_name      ILIKE %1$L OR
        r.guest_phone          ILIKE %1$L OR
        r.guest_structure      ILIKE %1$L OR
        r.guest_email_secondary ILIKE %1$L OR
        r.guest_phone_secondary ILIKE %1$L OR
        r.crm_id               ILIKE %1$L OR
        r.crm_structure_id     ILIKE %1$L
      )
    $fmt$, '%' || v_token || '%');
  END LOOP;

  IF ARRAY_LENGTH(v_where_and, 1) IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  v_all_where := ARRAY_TO_STRING(v_where_and, ' AND ');

  -- ============================================
  -- 4. Exécuter la requête avec filtre par company_id
  -- ============================================
  -- Sous-select ORDER BY created_at DESC LIMIT %s : borne aux 200 plus
  -- récents avant ARRAY_AGG pour garder l'URL du .in() côté service bornée.
  v_sql := FORMAT($sql$
    SELECT ARRAY_AGG(sub.id) FROM (
      SELECT r.id, r.created_at
      FROM public.reservations r
      INNER JOIN public.slots s ON s.id = r.slot_id
      INNER JOIN public.shows sh ON sh.id = s.show_id AND sh.company_id = %L
      WHERE %s
      ORDER BY r.created_at DESC
      LIMIT %s
    ) sub
  $sql$, v_company_id, v_all_where, v_cap);

  EXECUTE v_sql INTO v_ids;

  RETURN COALESCE(v_ids, ARRAY[]::UUID[]);
END;
$$;

COMMENT ON FUNCTION public.search_company_reservation_ids IS
  'Recherche textuelle multi-tokens sur les réservations, côté compagnie. '
  'Champs couverts : 9 colonnes guest_* + CRM ids de reservations. '
  'Périmètre : uniquement les résas dont le show.company_id correspond '
  'au profil du user connecté (rôle company obligatoire). '
  'Limite connue : les résas de pros connectés ont guest_* NULL et ne '
  'seront pas trouvées — la RLS empêche la jointure profiles côté '
  'compagnie.';

GRANT EXECUTE ON FUNCTION public.search_company_reservation_ids TO authenticated;
