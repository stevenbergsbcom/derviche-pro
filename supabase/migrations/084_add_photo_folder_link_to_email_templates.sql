-- ============================================
-- Migration 084 : Ajout lien dossier photo dans email_templates
-- Derviche Diffusion - Session S170
-- ============================================
-- Ajoute 2 colonnes sur email_templates pour gérer le nouveau
-- lien optionnel "dossier photo" dans les emails post-checkin.
-- Même pattern que show_folder_link / folder_link_text (migration 071).
-- ============================================

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS show_photo_folder_link  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_folder_link_text  TEXT    NOT NULL DEFAULT 'Consulter le dossier photo';

-- Commentaires
COMMENT ON COLUMN public.email_templates.show_photo_folder_link
  IS 'Afficher le lien vers le dossier photo si photo_folder_url est renseigné sur le spectacle';
COMMENT ON COLUMN public.email_templates.photo_folder_link_text
  IS 'Texte du lien dossier photo (ex: "Consulter le dossier photo")';
