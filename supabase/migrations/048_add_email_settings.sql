-- ============================================
-- Migration 048 - Ajout des clés email dans app_settings
-- Date: 2026-03-02
-- Objectif: Ajouter les paramètres email nécessaires pour les emails
--           transactionnels (confirmation, annulation, rappels)
--           Ces valeurs sont modifiables par les super-admins via
--           l'interface /admin/preferences
-- ============================================

-- Insérer les nouvelles clés email (idempotent)
INSERT INTO app_settings (key, value, description)
VALUES
  (
    'email_reply_to',
    '"contact@derviche-pro.fr"',
    'Adresse email de réponse (différente de l''expéditeur)'
  ),
  (
    'email_confirmation_subject',
    '"Votre réservation est confirmée — Derviche Diffusion"',
    'Objet de l''email de confirmation de réservation'
  ),
  (
    'email_cancellation_subject',
    '"Annulation de votre réservation — Derviche Diffusion"',
    'Objet de l''email d''annulation de réservation'
  ),
  (
    'email_footer_text',
    '"Derviche Diffusion — contact@derviche-pro.fr"',
    'Pied de page affiché dans tous les emails'
  ),
  (
    'email_signature',
    '"L''équipe Derviche Diffusion"',
    'Signature affichée en fin d''email'
  )
ON CONFLICT (key) DO NOTHING;
