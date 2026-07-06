-- ============================================
-- Migration 125: RPC search_reservation_ids — recherche admin élargie
-- Derviche Diffusion
-- Date: 2026-07-06
-- ============================================
-- CONTEXTE :
-- La recherche de la page /admin/reservations ne fonctionne que sur 3
-- colonnes (guest_email, guest_first_name, guest_last_name). Ces colonnes
-- ne sont renseignées QUE pour les résa guest — donc les résa faites par
-- un pro connecté à son compte (user_id IS NOT NULL) sont invisibles à
-- la recherche. Le client remonte ce problème (07-06).
--
-- SOLUTION :
-- Une RPC qui fait le OR côté SQL sur 13 colonnes (7 guest_* + 5 profiles
-- via jointure user_id + 2 CRM ids), avec support multi-tokens (un espace
-- dans la requête = tous les tokens doivent matcher). Retourne les IDs
-- des résas matchantes, que le service TypeScript applique en filtre
-- .in('id', ids) sur la query principale — ainsi la pagination et les
-- autres filtres restent inchangés.
--
-- ARBORESCENCE DES COLONNES CHERCHÉES :
--   Résa guest (user_id IS NULL) :
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
--   Résa pro connecté (user_id IS NOT NULL) — jointure profiles :
--     - profiles.first_name
--     - profiles.last_name
--     - profiles.email
--     - profiles.phone
--     - profiles.structure
--     - profiles.crm_id
--     - profiles.crm_structure_id
--
-- MULTI-TOKENS :
-- Split par espace(s). Ex: "Jean Dupont" → deux tokens.
-- Chaque token doit matcher AU MOINS une des colonnes ci-dessus
-- (AND entre tokens, OR entre colonnes).
--
-- PÉRIMÈTRE PAR RÔLE :
-- - super-admin / admin : toutes les résas
-- - externe : uniquement les résas des shows où il a un slot assigné
--   (jointure user_show_assignments)
-- - autres rôles : rejeté
--
-- SÉCURITÉ :
-- - SECURITY DEFINER : la RPC bypasse RLS (nécessaire pour la jointure
--   profiles côté externe), mais applique elle-même le filtre par rôle.
-- - GRANT EXECUTE réservé aux rôles authentifiés uniquement.
-- ============================================

CREATE OR REPLACE FUNCTION public.search_reservation_ids(
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
  v_tokens TEXT[];
  v_token TEXT;
  v_ids UUID[];
  v_sql TEXT;
  v_where_and TEXT[];
  v_all_where TEXT;
  -- Plafond de résultats. Motif : le service applique ensuite
  -- `.in('id', ids)` en GET → les UUIDs partent dans l'URL (~37 car./UUID).
  -- Le gateway Supabase plafonne l'URL vers 8-16 KB → au-delà de ~200-400
  -- IDs la requête casse. On borne donc ici aux 200 résultats les plus
  -- récents. Voir mémoire projet « recherche-in-url-limit ».
  -- ⚠ Garder synchro avec SEARCH_RESULT_CAP côté TypeScript (constants.ts).
  v_cap CONSTANT INTEGER := 200;
BEGIN
  -- ============================================
  -- 1. Authentification + rôle
  -- ============================================
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_role IS NULL OR v_role NOT IN ('super-admin', 'admin', 'externe') THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  -- ============================================
  -- 2. Sanitize + split en tokens
  -- ============================================
  -- Retire caractères dangereux (%, _, guillemets) + normalise espaces.
  -- Note : les % sont autorisés en syntaxe ILIKE mais on les échappe
  -- pour éviter qu'un user injecte des wildcards indésirables.
  p_term := REGEXP_REPLACE(TRIM(COALESCE(p_term, '')), '[%_\\]', ' ', 'g');
  p_term := REGEXP_REPLACE(p_term, '\s+', ' ', 'g');

  IF p_term = '' THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  v_tokens := STRING_TO_ARRAY(p_term, ' ');

  -- ============================================
  -- 3. Construire dynamiquement le WHERE
  -- ============================================
  -- Pour chaque token, un bloc `(colA ILIKE ... OR colB ILIKE ... OR ...)`.
  -- Tous les blocs sont AND-és entre eux (tous les tokens doivent matcher
  -- au moins une colonne).
  v_where_and := ARRAY[]::TEXT[];

  FOREACH v_token IN ARRAY v_tokens LOOP
    -- Ignore les tokens < 2 caractères (aligne avec le min front) : un
    -- token d'1 lettre matcherait trop de lignes pour rien.
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
        r.crm_structure_id     ILIKE %1$L OR
        p.first_name           ILIKE %1$L OR
        p.last_name            ILIKE %1$L OR
        p.email                ILIKE %1$L OR
        p.phone                ILIKE %1$L OR
        p.structure            ILIKE %1$L OR
        p.crm_id               ILIKE %1$L OR
        p.crm_structure_id     ILIKE %1$L
      )
    $fmt$, '%' || v_token || '%');
  END LOOP;

  IF ARRAY_LENGTH(v_where_and, 1) IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  v_all_where := ARRAY_TO_STRING(v_where_and, ' AND ');

  -- ============================================
  -- 4. Exécuter la requête avec filtre par rôle
  -- ============================================
  -- Le sous-select ORDER BY created_at DESC LIMIT %s borne les résultats
  -- aux 200 plus récents AVANT l'ARRAY_AGG (voir v_cap). Ainsi l'URL du
  -- .in() côté service reste bornée.
  IF v_role = 'externe' THEN
    -- Externe : jointure user_show_assignments pour restreindre aux
    -- shows assignés. On passe par slots pour remonter à show_id.
    v_sql := FORMAT($sql$
      SELECT ARRAY_AGG(sub.id) FROM (
        SELECT r.id, r.created_at
        FROM public.reservations r
        LEFT JOIN public.profiles p ON p.id = r.user_id
        INNER JOIN public.slots s ON s.id = r.slot_id
        INNER JOIN public.user_show_assignments usa
          ON usa.show_id = s.show_id
          AND usa.user_id = %L
        WHERE %s
        ORDER BY r.created_at DESC
        LIMIT %s
      ) sub
    $sql$, v_user_id, v_all_where, v_cap);
  ELSE
    -- super-admin / admin : toutes les résas
    v_sql := FORMAT($sql$
      SELECT ARRAY_AGG(sub.id) FROM (
        SELECT r.id, r.created_at
        FROM public.reservations r
        LEFT JOIN public.profiles p ON p.id = r.user_id
        WHERE %s
        ORDER BY r.created_at DESC
        LIMIT %s
      ) sub
    $sql$, v_all_where, v_cap);
  END IF;

  EXECUTE v_sql INTO v_ids;

  RETURN COALESCE(v_ids, ARRAY[]::UUID[]);
END;
$$;

COMMENT ON FUNCTION public.search_reservation_ids IS
  'Recherche textuelle multi-tokens sur les réservations. '
  'Champs couverts : 9 colonnes reservations.guest_* + 2 CRM ids + '
  '7 colonnes profiles (jointure user_id). '
  'Multi-tokens : chaque token (séparé par espace) doit matcher au moins '
  'une colonne. '
  'Périmètre : super-admin/admin voient tout, externe voit uniquement '
  'les résas des shows où il est assigné.';

GRANT EXECUTE ON FUNCTION public.search_reservation_ids TO authenticated;
