-- Migration 097: Corriger la récursion infinie dans la policy RLS profiles.
-- La policy 096 faisait un subquery sur shows, qui joint profiles via FK,
-- ce qui re-déclenchait la policy profiles → boucle infinie.
-- Solution : fonction SECURITY DEFINER (bypass RLS) pour la vérification.

-- 1. Supprimer la policy récursive
DROP POLICY IF EXISTS "Public can read show manager profiles" ON public.profiles;

-- 2. Créer une fonction SECURITY DEFINER (pas soumise aux RLS)
CREATE OR REPLACE FUNCTION public.is_published_show_manager(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shows
    WHERE derviche_manager_id = profile_id
      AND status = 'published'
      AND deleted_at IS NULL
  );
$$;

-- 3. Recréer la policy en utilisant la fonction
CREATE POLICY "Public can read show manager profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_published_show_manager(id));
