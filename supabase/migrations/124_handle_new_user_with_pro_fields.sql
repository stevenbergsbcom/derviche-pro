-- ============================================
-- Migration 124: Étendre handle_new_user pour copier structure / ville / CP
--                depuis raw_user_meta_data lors de l'inscription
-- Derviche Diffusion
-- Date: 2026-06-05
-- ============================================
-- CONTEXTE :
-- Dans la foulée de la migration 123 (structure / ville / code postal
-- obligatoires à la création d'une réservation), on rend ces 3 champs
-- obligatoires aussi à l'inscription pro (RegisterForm). Ils sont passés
-- via `options.data` au `supabase.auth.signUp()` et arrivent dans
-- `auth.users.raw_user_meta_data`. Le trigger `handle_new_user` doit
-- donc les copier dans `profiles` au même titre que first_name /
-- last_name / phone (pattern établi en migration 043).
--
-- Sans cette migration, les données saisies seraient écrites uniquement
-- dans le user_metadata Supabase Auth et perdues côté `profiles`.
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    structure,
    postal_code,
    city,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- Lire depuis raw_user_meta_data (passé via options.data au signUp).
    -- NULLIF + TRIM : on évite d'insérer des chaînes vides en BDD.
    NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    -- Migration 124 : nouveaux champs obligatoires à l'inscription
    NULLIF(TRIM(NEW.raw_user_meta_data->>'structure'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'postal_code'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'city'), ''),
    NOW(),
    NOW()
  );

  -- Par défaut, assigner le rôle "professional" (R-USER-03)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'professional');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS
  'Crée automatiquement un profil + rôle professional lors du signUp. '
  'Récupère first_name, last_name, phone, structure, postal_code, city '
  'depuis raw_user_meta_data si disponibles.';
