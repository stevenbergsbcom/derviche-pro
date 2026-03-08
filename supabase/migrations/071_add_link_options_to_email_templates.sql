-- ============================================
-- Migration 071 : Liens optionnels dans les templates post-checkin
-- Derviche Diffusion - Session S149
-- ============================================
-- Ajoute 8 colonnes sur email_templates pour gérer les 4 liens
-- optionnels affichables dans les emails post-checkin :
--   • Dossier de presse (folder_url sur shows)
--   • Teaser vidéo (teaser_url sur shows)
--   • Captation vidéo (captation_url sur shows)
--   • Page de réservation du spectacle (construite depuis show_slug)
--
-- Pour chaque lien : un boolean d'activation + un texte introductif éditable.
-- La condition d'affichage (URL présente ou non) est gérée côté code.
-- ============================================

ALTER TABLE public.email_templates
  -- Lien dossier de presse
  ADD COLUMN IF NOT EXISTS show_folder_link    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS folder_link_text    TEXT    NOT NULL DEFAULT 'Consulter le dossier de presse',

  -- Lien teaser vidéo
  ADD COLUMN IF NOT EXISTS show_teaser_link    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS teaser_link_text    TEXT    NOT NULL DEFAULT 'Voir le teaser vidéo',

  -- Lien captation vidéo
  ADD COLUMN IF NOT EXISTS show_captation_link BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS captation_link_text TEXT    NOT NULL DEFAULT 'Voir la captation vidéo',

  -- Lien page de réservation du spectacle
  ADD COLUMN IF NOT EXISTS show_booking_link   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_link_text   TEXT    NOT NULL DEFAULT 'Réserver une place pour ce spectacle';

-- Commentaires
COMMENT ON COLUMN public.email_templates.show_folder_link
  IS 'Afficher le lien vers le dossier de presse si folder_url est renseigné sur le spectacle';
COMMENT ON COLUMN public.email_templates.folder_link_text
  IS 'Texte du lien dossier de presse (ex: "Consulter le dossier de presse")';

COMMENT ON COLUMN public.email_templates.show_teaser_link
  IS 'Afficher le lien vers le teaser si teaser_url est renseigné sur le spectacle';
COMMENT ON COLUMN public.email_templates.teaser_link_text
  IS 'Texte du lien teaser (ex: "Voir le teaser vidéo")';

COMMENT ON COLUMN public.email_templates.show_captation_link
  IS 'Afficher le lien vers la captation si captation_url est renseigné sur le spectacle';
COMMENT ON COLUMN public.email_templates.captation_link_text
  IS 'Texte du lien captation (ex: "Voir la captation vidéo")';

COMMENT ON COLUMN public.email_templates.show_booking_link
  IS 'Afficher un lien vers la page de réservation du spectacle sur le catalogue public';
COMMENT ON COLUMN public.email_templates.booking_link_text
  IS 'Texte du lien de réservation (ex: "Réserver une place pour ce spectacle")';
