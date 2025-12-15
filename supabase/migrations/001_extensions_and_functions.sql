-- ============================================
-- MIGRATION 001 : Extensions et Fonctions Helper
-- Derviche Diffusion - Plateforme de réservation
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================

-- Extension pour génération d'UUID (souvent déjà activée sur Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour recherche full-text avec trigrammes
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- FONCTIONS HELPER POUR RLS
-- ============================================

-- Vérifier si l'utilisateur connecté a un rôle spécifique
CREATE OR REPLACE FUNCTION public.has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifier si l'utilisateur connecté est super-admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super-admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifier si l'utilisateur connecté est admin ou super-admin
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super-admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifier si un externe-DD a accès à un spectacle spécifique
-- (via la table user_show_assignments)
CREATE OR REPLACE FUNCTION public.externe_has_access_to_show(p_show_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_show_assignments
    WHERE user_id = auth.uid()
    AND show_id = p_show_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifier si l'utilisateur connecté est une compagnie
-- et si le spectacle appartient à sa compagnie
CREATE OR REPLACE FUNCTION public.is_own_company_show(p_show_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Récupérer le company_id de l'utilisateur connecté
  SELECT company_id INTO v_company_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Vérifier si le spectacle appartient à cette compagnie
  RETURN EXISTS (
    SELECT 1 FROM public.shows
    WHERE id = p_show_id
    AND company_id = v_company_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- FONCTION UTILITAIRE : Génération de slug
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convertir en minuscules
  slug := LOWER(title);
  
  -- Remplacer les caractères accentués
  slug := TRANSLATE(slug, 
    'àáâãäåèéêëìíîïòóôõöùúûüýÿñç',
    'aaaaaaeeeeiiiioooooouuuuyync'
  );
  
  -- Remplacer les espaces et caractères spéciaux par des tirets
  slug := REGEXP_REPLACE(slug, '[^a-z0-9]+', '-', 'g');
  
  -- Supprimer les tirets en début et fin
  slug := TRIM(BOTH '-' FROM slug);
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FONCTION UTILITAIRE : Mise à jour updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;