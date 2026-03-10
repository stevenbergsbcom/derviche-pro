-- ============================================
-- Migration 083 : Ajout lien dossier photo sur shows
-- Derviche Diffusion - Session S170
-- ============================================
-- Ajoute la colonne photo_folder_url sur la table shows.
-- Même comportement que folder_url (dossier de presse) :
--   • Saisie dans le formulaire admin spectacle
--   • Affiché dans la vue admin spectacle
--   • Lien optionnel dans les templates email post-checkin
--   • N'apparaît PAS sur le catalogue public
-- ============================================

ALTER TABLE public.shows
  ADD COLUMN IF NOT EXISTS photo_folder_url TEXT;

-- Commentaire
COMMENT ON COLUMN public.shows.photo_folder_url
  IS 'URL du dossier photo du spectacle (Google Drive, Dropbox, etc.) — affiché uniquement dans les emails post-checkin et la vue admin';
