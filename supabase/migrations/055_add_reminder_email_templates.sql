-- ============================================
-- Migration 055 - Templates email rappels automatiques
-- Date: 2026-03-04
-- Objectif: Ajouter les 3 templates de rappel automatique
--           (J-7, J-2, H-12) dans la table email_templates.
--
-- Ces templates sont utilisés par les cron jobs Vercel :
--   reminder_7d  → cron daily, 7 jours avant la représentation
--   reminder_2d  → cron daily, 2 jours avant la représentation
--   reminder_12h → cron hourly, 12 heures avant la représentation
--
-- Variables disponibles (identiques aux autres templates) :
--   {{prénom}}       → prénom du professionnel
--   {{nom}}          → nom du professionnel
--   {{spectacle}}    → titre du spectacle
--   {{date}}         → date formatée du créneau
--   {{heure}}        → heure formatée du créneau
--   {{lieu}}         → nom du lieu
--   {{code}}         → code de réservation
--   {{organisation}} → organization_name depuis app_settings
--
-- Tracking des envois : via la table sent_notifications existante
--   (type CHECK inclut déjà 'reminder_7d', 'reminder_2d', 'reminder_12h')
-- ============================================

INSERT INTO public.email_templates (
  template_key,
  name,
  header_title,
  subject,
  intro_text,
  body_text,
  info_text,
  salutation,
  cta_text,
  contact_block_title,
  show_contact_block,
  show_reservation_code
)
VALUES
  -- ── Rappel J-7 ─────────────────────────────────────────────────────────────
  (
    'reminder_7d',
    'Rappel J-7 (7 jours avant)',
    'Rappel — dans 7 jours 📅',
    'Rappel : {{spectacle}} dans 7 jours — {{organisation}}',
    'Bonjour {{prénom}},' || chr(10) || chr(10) ||
    'Nous vous rappelons que vous avez réservé des places pour {{spectacle}}. La représentation a lieu dans 7 jours.',
    'Nous avons hâte de vous accueillir !',
    'Pensez à noter l''adresse du lieu et à prévoir votre trajet en avance.',
    'À très bientôt,',
    'Voir le spectacle →',
    'Votre contact Derviche Diffusion',
    true,
    false
  ),
  -- ── Rappel J-2 ─────────────────────────────────────────────────────────────
  (
    'reminder_2d',
    'Rappel J-2 (2 jours avant)',
    'Rappel — dans 2 jours 📅',
    'Rappel : {{spectacle}} dans 2 jours — {{organisation}}',
    'Bonjour {{prénom}},' || chr(10) || chr(10) ||
    'Plus que 2 jours ! Nous vous rappelons votre réservation pour {{spectacle}}.',
    'Nous vous attendons avec plaisir.',
    'Si vous ne pouvez plus venir, pensez à annuler votre réservation pour libérer votre place.',
    'À très bientôt,',
    'Voir le spectacle →',
    'Votre contact Derviche Diffusion',
    true,
    false
  ),
  -- ── Rappel H-12 ────────────────────────────────────────────────────────────
  (
    'reminder_12h',
    'Rappel H-12 (12 heures avant)',
    'C''est aujourd''hui ! 🎭',
    'C''est aujourd''hui : {{spectacle}} à {{heure}} — {{organisation}}',
    'Bonjour {{prénom}},' || chr(10) || chr(10) ||
    'La représentation de {{spectacle}} a lieu aujourd''hui à {{heure}}. Nous vous attendons !',
    '',
    'Pensez à vous munir de cet email comme justificatif à l''entrée.',
    'À tout à l''heure,',
    'Voir le spectacle →',
    'Votre contact Derviche Diffusion',
    true,
    false
  )
ON CONFLICT (template_key) DO NOTHING;
