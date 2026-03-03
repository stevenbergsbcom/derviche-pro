-- ============================================
-- Migration 053 - Correction email_catalogue_url
-- Date: 2026-03-03
-- Objectif: Corriger l'URL du catalogue dans app_settings
--           qui pointait vers Vercel au lieu du domaine de production
-- ============================================

UPDATE app_settings
SET
  value = '"https://derviche-pro.fr/catalogue"',
  updated_at = NOW()
WHERE key = 'email_catalogue_url';

-- Vérification
-- SELECT key, value FROM app_settings WHERE key = 'email_catalogue_url';
-- Résultat attendu : "https://derviche-pro.fr/catalogue"
