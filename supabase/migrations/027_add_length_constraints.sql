-- ============================================
-- Migration 027: Ajouter des contraintes de longueur sur les champs texte
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-01-21
-- ============================================
-- SÉCURITÉ: Cette migration ajoute des contraintes CHECK pour :
--   - Limiter la longueur des champs texte (protection DoS)
--   - Assurer la cohérence des données
--   - Doubler la validation serveur de la RPC
-- ============================================

-- ============================================
-- TABLE: reservations
-- ============================================

-- Prénom (max 100)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_guest_first_name_length;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_guest_first_name_length 
CHECK (guest_first_name IS NULL OR LENGTH(guest_first_name) <= 100);

-- Nom (max 100)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_guest_last_name_length;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_guest_last_name_length 
CHECK (guest_last_name IS NULL OR LENGTH(guest_last_name) <= 100);

-- Email (max 255)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_guest_email_length;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_guest_email_length 
CHECK (guest_email IS NULL OR LENGTH(guest_email) <= 255);

-- Email secondaire (max 255)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_guest_email_secondary_length;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_guest_email_secondary_length 
CHECK (guest_email_secondary IS NULL OR LENGTH(guest_email_secondary) <= 255);

-- Téléphone (max 20)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_guest_phone_length;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_guest_phone_length 
CHECK (guest_phone IS NULL OR LENGTH(guest_phone) <= 20);

-- Téléphone secondaire (max 20)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_guest_phone_secondary_length;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_guest_phone_secondary_length 
CHECK (guest_phone_secondary IS NULL OR LENGTH(guest_phone_secondary) <= 20);

-- Adresse (max 500)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_guest_address_length;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_guest_address_length 
CHECK (guest_address IS NULL OR LENGTH(guest_address) <= 500);

-- Code postal (max 10)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_guest_postal_code_length;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_guest_postal_code_length 
CHECK (guest_postal_code IS NULL OR LENGTH(guest_postal_code) <= 10);

-- Ville (max 100)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_guest_city_length;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_guest_city_length 
CHECK (guest_city IS NULL OR LENGTH(guest_city) <= 100);

-- Structure/Organisation (max 200)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_guest_structure_length;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_guest_structure_length 
CHECK (guest_structure IS NULL OR LENGTH(guest_structure) <= 200);

-- Fonction (max 100)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_guest_function_length;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_guest_function_length 
CHECK (guest_function IS NULL OR LENGTH(guest_function) <= 100);

-- Commentaires spéciaux (max 2000)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_special_requests_length;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_special_requests_length 
CHECK (special_requests IS NULL OR LENGTH(special_requests) <= 2000);

-- Nombre de places (1-50)
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS chk_num_places_range;

ALTER TABLE public.reservations
ADD CONSTRAINT chk_num_places_range 
CHECK (num_places >= 1 AND num_places <= 50);

-- ============================================
-- TABLE: shows (spectacles)
-- ============================================

-- Titre (max 200)
ALTER TABLE public.shows
DROP CONSTRAINT IF EXISTS chk_shows_title_length;

ALTER TABLE public.shows
ADD CONSTRAINT chk_shows_title_length 
CHECK (title IS NULL OR LENGTH(title) <= 200);

-- Slug (max 250)
ALTER TABLE public.shows
DROP CONSTRAINT IF EXISTS chk_shows_slug_length;

ALTER TABLE public.shows
ADD CONSTRAINT chk_shows_slug_length 
CHECK (slug IS NULL OR LENGTH(slug) <= 250);

-- ============================================
-- TABLE: venues (lieux)
-- ============================================

-- Nom (max 200)
ALTER TABLE public.venues
DROP CONSTRAINT IF EXISTS chk_venues_name_length;

ALTER TABLE public.venues
ADD CONSTRAINT chk_venues_name_length 
CHECK (name IS NULL OR LENGTH(name) <= 200);

-- Ville (max 100)
ALTER TABLE public.venues
DROP CONSTRAINT IF EXISTS chk_venues_city_length;

ALTER TABLE public.venues
ADD CONSTRAINT chk_venues_city_length 
CHECK (city IS NULL OR LENGTH(city) <= 100);

-- Adresse (max 500)
ALTER TABLE public.venues
DROP CONSTRAINT IF EXISTS chk_venues_address_length;

ALTER TABLE public.venues
ADD CONSTRAINT chk_venues_address_length 
CHECK (address IS NULL OR LENGTH(address) <= 500);

-- ============================================
-- TABLE: companies (compagnies)
-- ============================================

-- Nom (max 200)
ALTER TABLE public.companies
DROP CONSTRAINT IF EXISTS chk_companies_name_length;

ALTER TABLE public.companies
ADD CONSTRAINT chk_companies_name_length 
CHECK (name IS NULL OR LENGTH(name) <= 200);

-- ============================================
-- Commentaire de documentation
-- ============================================
COMMENT ON CONSTRAINT chk_guest_first_name_length ON public.reservations IS 'Limite prénom à 100 caractères';
COMMENT ON CONSTRAINT chk_guest_last_name_length ON public.reservations IS 'Limite nom à 100 caractères';
COMMENT ON CONSTRAINT chk_guest_email_length ON public.reservations IS 'Limite email à 255 caractères';
COMMENT ON CONSTRAINT chk_num_places_range ON public.reservations IS 'Nombre de places entre 1 et 50';
