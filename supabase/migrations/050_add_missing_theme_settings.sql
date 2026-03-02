-- ============================================
-- Migration 050 - Clés app_settings manquantes
-- Date: 2026-03-02
-- Objectif: Ajouter les clés consommées par le code mais absentes de DB
--
-- 1. Clés de thème (lues par getThemeSettings() et la sidebar)
--    Lecture publique autorisée via policy migration 041
--
-- 2. organization_address
--    Le code TypeScript (app-settings.ts, organization-section.tsx) utilise
--    cette clé de façon cohérente. La migration 004 avait inséré
--    organization_website par erreur (jamais consommée par le code).
--    organization_website reste en DB pour compatibilité mais n'est pas utilisée.
-- ============================================

INSERT INTO public.app_settings (key, value, description)
VALUES
  -- Clés de thème
  (
    'theme_preset',
    '"classic"',
    'Thème de couleurs de l''interface (classic, modern, etc.)'
  ),
  (
    'logo_white_url',
    '""',
    'URL du logo version blanche (utilisé sur fond sombre dans la sidebar)'
  ),
  (
    'logo_dark_url',
    '""',
    'URL du logo version sombre (utilisé sur fond clair)'
  ),
  -- Adresse organisation (manquait depuis migration 004)
  (
    'organization_address',
    'null',
    'Adresse postale de l''organisation'
  )
ON CONFLICT (key) DO NOTHING;
