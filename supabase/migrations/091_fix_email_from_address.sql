-- ============================================
-- Migration 091 — Fix adresse email expéditeur
-- ============================================
-- Resend n'autorise pas l'envoi depuis @gmail.com.
-- Remplace les adresses gmail par le domaine vérifié derviche-pro.fr.

UPDATE app_settings
SET value = '"reservation@derviche-pro.fr"'
WHERE key = 'email_from_address'
  AND value::text LIKE '%gmail.com%';

UPDATE app_settings
SET value = '"reservation@derviche-pro.fr"'
WHERE key = 'email_reply_to'
  AND value::text LIKE '%gmail.com%';

UPDATE app_settings
SET value = '"Derviche Diffusion — reservation@derviche-pro.fr"'
WHERE key = 'email_footer_text'
  AND value::text LIKE '%gmail.com%';
