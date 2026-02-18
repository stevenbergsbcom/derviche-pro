-- ============================================
-- Migration 043: Fix handle_new_user - récupérer first_name/last_name depuis user_metadata
-- Derviche Diffusion
-- Date: 2026-02-18
-- ============================================
-- PROBLÈME : Le trigger handle_new_user n'insérait que id + email dans profiles.
-- Les champs first_name, last_name (et phone) passés via options.data au signUp
-- étaient stockés dans auth.users.raw_user_meta_data mais jamais copiés dans profiles.
-- Résultat : profils toujours vides après inscription.
--
-- CORRECTION : Lire raw_user_meta_data lors de la création du profil.
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
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- Lire depuis raw_user_meta_data (passé via options.data au signUp)
    NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
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
  'Crée automatiquement un profil + rôle professional lors du signUp.
   Récupère first_name, last_name, phone depuis raw_user_meta_data si disponibles.';
