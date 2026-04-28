-- ============================================
-- Migration 116 : Retire l'emoji 🎭 des templates email
-- Derviche Diffusion
-- Date: 2026-04-28
-- ============================================
-- CONTEXTE :
--   Demande client : supprimer l'illustration de masque de théâtre
--   (emoji Unicode 🎭, U+1F3AD) de tous les emails envoyés.
--
--   L'emoji a été inséré dans la migration 055 sur le template
--   `reminder_12h` (renommé `reminder_4h` par migration 100) :
--     header_title = 'C''est aujourd''hui ! 🎭'
--
--   Aujourd'hui en DB, ce header_title contient toujours l'emoji
--   sauf si un super-admin l'a déjà modifié manuellement via
--   /admin/preferences > Templates email.
--
-- APPROCHE SAFE :
--   On utilise REPLACE conditionnel via WHERE LIKE '%🎭%' afin de :
--     - ne toucher QUE les lignes contenant l'emoji
--     - préserver toute personnalisation faite ailleurs dans le
--       template (subject, intro_text, etc.)
--     - être idempotente (replay possible sans effet de bord)
--
--   On nettoie aussi les espaces résiduels (« ! 🎭 » → « ! »).
--
-- IMPACT :
--   - Modifie email_templates.header_title pour les templates qui
--     contiennent 🎭 (typiquement reminder_4h en l'état).
--   - Aucune autre colonne touchée.
--   - Code applicatif (fallbacks.ts + builders/simple.ts) déjà
--     mis à jour dans le même PR pour ne plus émettre l'emoji.
-- ============================================

UPDATE public.email_templates
SET header_title = TRIM(REPLACE(header_title, '🎭', ''))
WHERE header_title LIKE '%🎭%';

-- ============================================
-- COMMENTAIRE DE TRAÇABILITÉ
-- ============================================

COMMENT ON COLUMN public.email_templates.header_title IS
  'Titre principal affiché dans le header HTML de l''email. '
  'Migration 116 (2026-04-28) : retrait de l''emoji 🎭 (U+1F3AD) '
  'demandé par le client pour homogénéiser le rendu des emails.';
