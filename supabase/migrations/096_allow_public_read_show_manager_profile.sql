-- Migration 096: Autoriser la lecture publique des infos de contact
-- des profils référencés comme derviche_manager_id dans les spectacles publiés.
-- Nécessaire pour afficher le contact du responsable Derviche sur la page spectacle publique.

CREATE POLICY "Public can read show manager profiles"
  ON public.profiles
  FOR SELECT
  USING (
    id IN (
      SELECT derviche_manager_id
      FROM public.shows
      WHERE derviche_manager_id IS NOT NULL
        AND status = 'published'
        AND deleted_at IS NULL
    )
  );
