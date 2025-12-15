-- ============================================
-- MIGRATION 002 : Tables Principales
-- Derviche Diffusion - Plateforme de réservation
-- ============================================

-- ============================================
-- TABLE : companies (Compagnies artistiques)
-- ============================================

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_companies_deleted_at ON public.companies(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.companies IS 'Compagnies artistiques représentées par Derviche Diffusion';

-- ============================================
-- TABLE : profiles (Profils utilisateurs)
-- Liée à auth.users de Supabase
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email2 TEXT,
  phone2 TEXT,
  function TEXT,
  structure TEXT,
  afc_number TEXT,
  address TEXT,
  comments TEXT,
  
  -- Lien avec compagnie (pour les comptes "company")
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  
  -- RGPD
  gdpr_consent BOOLEAN DEFAULT FALSE NOT NULL,
  gdpr_consent_date TIMESTAMPTZ,
  gdpr_data_retention_accepted BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Tracking connexion (pour RGPD - suppression après inactivité)
  last_login_at TIMESTAMPTZ,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX idx_profiles_company ON public.profiles(company_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_last_login ON public.profiles(last_login_at);
CREATE INDEX idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;

-- Index pour recherche full-text (nom, email, structure)
CREATE INDEX idx_profiles_search ON public.profiles 
  USING gin ((first_name || ' ' || last_name || ' ' || COALESCE(email, '') || ' ' || COALESCE(structure, '')) gin_trgm_ops);

COMMENT ON TABLE public.profiles IS 'Profils des utilisateurs (programmateurs, admins, compagnies, externes)';

-- ============================================
-- TABLE : user_roles (Rôles des utilisateurs)
-- Un utilisateur = un seul rôle (règle R-USER-01)
-- ============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super-admin', 'admin', 'professional', 'company', 'externe-dd')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Un utilisateur ne peut avoir qu'un seul rôle
  UNIQUE(user_id)
);

-- Index
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

COMMENT ON TABLE public.user_roles IS 'Rôles des utilisateurs (un seul rôle par utilisateur)';
COMMENT ON COLUMN public.user_roles.role IS 'super-admin | admin | professional | company | externe-dd';

-- ============================================
-- TABLE : venues (Salles de spectacle)
-- ============================================

CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'France' NOT NULL,
  
  -- Géolocalisation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Informations complémentaires
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  photo_url TEXT,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX idx_venues_city ON public.venues(city);
CREATE INDEX idx_venues_deleted_at ON public.venues(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.venues IS 'Salles de spectacle où se déroulent les représentations';

-- ============================================
-- TABLE : show_categories (Catégories de spectacles)
-- ============================================

CREATE TABLE public.show_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  display_order INTEGER DEFAULT 0 NOT NULL,
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX idx_show_categories_slug ON public.show_categories(slug);
CREATE INDEX idx_show_categories_order ON public.show_categories(display_order);

COMMENT ON TABLE public.show_categories IS 'Catégories/genres de spectacles (théâtre, danse, cirque, etc.)';

-- ============================================
-- TABLE : user_show_assignments 
-- (Assignation des externes-DD aux spectacles)
-- ============================================

CREATE TABLE public.user_show_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_id UUID NOT NULL, -- Référence ajoutée après création de la table shows
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Un externe ne peut être assigné qu'une fois à un spectacle
  UNIQUE(user_id, show_id)
);

-- Index
CREATE INDEX idx_user_show_assignments_user ON public.user_show_assignments(user_id);
CREATE INDEX idx_user_show_assignments_show ON public.user_show_assignments(show_id);

COMMENT ON TABLE public.user_show_assignments IS 'Assignation des externes-DD aux spectacles dont ils ont la charge';

-- ============================================
-- TRIGGERS : Mise à jour automatique de updated_at
-- ============================================

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_show_categories_updated_at
  BEFORE UPDATE ON public.show_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();