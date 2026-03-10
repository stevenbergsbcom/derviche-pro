-- ============================================
-- Migration 082 : companies.contact_email nullable
-- Derviche Diffusion — Derviche Pro
-- S168 : L'email de contact d'une compagnie est optionnel.
-- Il peut être renseigné après coup via /admin/compagnies.
-- ============================================

ALTER TABLE public.companies
  ALTER COLUMN contact_email DROP NOT NULL;

COMMENT ON COLUMN public.companies.contact_email IS 'Email de contact de la compagnie (optionnel). Ne donne pas accès à la plateforme — créer un compte via /admin/compagnies.';
