-- ============================================
-- MIGRATION 003 : Tables Spectacles et Réservations
-- Derviche Diffusion - Plateforme de réservation
-- ============================================

-- ============================================
-- TABLE : shows (Spectacles)
-- ============================================

CREATE TABLE public.shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  
  -- Descriptions
  short_description TEXT,
  long_description TEXT,
  
  -- Informations pratiques
  duration_minutes INTEGER,
  practical_info TEXT,
  
  -- Médias
  image_url TEXT,
  gallery_urls TEXT[],
  
  -- Statut et publication
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Tarification
  price_type TEXT NOT NULL DEFAULT 'free' CHECK (price_type IN ('free', 'paid_on_site')),
  price_amount DECIMAL(10, 2),
  
  -- Règles de réservation
  max_reservations_per_booking INTEGER DEFAULT 4 NOT NULL 
    CHECK (max_reservations_per_booking BETWEEN 1 AND 10),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX idx_shows_company ON public.shows(company_id);
CREATE INDEX idx_shows_status ON public.shows(status);
CREATE INDEX idx_shows_slug ON public.shows(slug);
CREATE INDEX idx_shows_deleted_at ON public.shows(deleted_at) WHERE deleted_at IS NULL;

-- Index pour recherche full-text
CREATE INDEX idx_shows_search ON public.shows 
  USING gin ((title || ' ' || COALESCE(short_description, '')) gin_trgm_ops);

COMMENT ON TABLE public.shows IS 'Spectacles proposés par les compagnies';
COMMENT ON COLUMN public.shows.status IS 'draft = brouillon, published = visible, archived = masqué du catalogue';
COMMENT ON COLUMN public.shows.price_type IS 'free = gratuit, paid_on_site = payant sur place';
COMMENT ON COLUMN public.shows.max_reservations_per_booking IS 'Nombre max de places par réservation (1-10)';

-- ============================================
-- AJOUT FK : user_show_assignments → shows
-- ============================================

ALTER TABLE public.user_show_assignments
  ADD CONSTRAINT fk_user_show_assignments_show
  FOREIGN KEY (show_id) REFERENCES public.shows(id) ON DELETE CASCADE;

-- ============================================
-- TABLE : show_category_mapping (N-N shows ↔ categories)
-- ============================================

CREATE TABLE public.show_category_mapping (
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.show_categories(id) ON DELETE CASCADE,
  
  -- Clé primaire composite
  PRIMARY KEY (show_id, category_id)
);

-- Index
CREATE INDEX idx_show_category_mapping_show ON public.show_category_mapping(show_id);
CREATE INDEX idx_show_category_mapping_category ON public.show_category_mapping(category_id);

COMMENT ON TABLE public.show_category_mapping IS 'Association N-N entre spectacles et catégories';

-- ============================================
-- TABLE : slots (Créneaux de représentation)
-- ============================================

CREATE TABLE public.slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE RESTRICT,
  
  -- Date et heure
  date DATE NOT NULL,
  time TIME NOT NULL,
  
  -- Capacité
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  remaining_capacity INTEGER NOT NULL CHECK (remaining_capacity >= 0),
  
  -- Qui assure l'accueil
  hosted_by TEXT NOT NULL CHECK (hosted_by IN ('derviche', 'company')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Contrainte d'unicité : un seul créneau par spectacle/salle/date/heure
  UNIQUE(show_id, venue_id, date, time)
);

-- Index
CREATE INDEX idx_slots_show ON public.slots(show_id);
CREATE INDEX idx_slots_venue ON public.slots(venue_id);
CREATE INDEX idx_slots_date ON public.slots(date);
CREATE INDEX idx_slots_datetime ON public.slots(date, time);
CREATE INDEX idx_slots_hosted_by ON public.slots(hosted_by);

COMMENT ON TABLE public.slots IS 'Créneaux de représentation (une date/heure pour un spectacle dans une salle)';
COMMENT ON COLUMN public.slots.hosted_by IS 'derviche = accueil par Derviche Diffusion, company = accueil par la compagnie';
COMMENT ON COLUMN public.slots.remaining_capacity IS 'Places restantes (géré automatiquement par trigger)';

-- ============================================
-- TABLE : reservations
-- ============================================

CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
  
  -- Utilisateur connecté (NULL si réservation invité)
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Données invité (si réservation sans compte)
  guest_first_name TEXT,
  guest_last_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guest_function TEXT,
  guest_structure TEXT,
  guest_afc_number TEXT,
  
  -- Données réservation
  num_places INTEGER NOT NULL CHECK (num_places > 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'no_show')),
  special_requests TEXT,
  
  -- Check-in
  checkin_status TEXT CHECK (checkin_status IN ('present_loved', 'present_press', 'present_neutral', 'absent')),
  checkin_comment TEXT,
  checkin_venue_notes TEXT,
  checkin_internal_notes TEXT,
  checkin_at TIMESTAMPTZ,
  checkin_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Google Calendar
  google_calendar_event_id TEXT,
  
  -- Annulation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Contrainte : soit user_id, soit les infos invité obligatoires
  CONSTRAINT check_user_or_guest CHECK (
    user_id IS NOT NULL 
    OR (
      guest_email IS NOT NULL 
      AND guest_first_name IS NOT NULL 
      AND guest_last_name IS NOT NULL
    )
  )
);

-- Index
CREATE INDEX idx_reservations_slot ON public.reservations(slot_id);
CREATE INDEX idx_reservations_user ON public.reservations(user_id);
CREATE INDEX idx_reservations_guest_email ON public.reservations(guest_email);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_checkin_status ON public.reservations(checkin_status);
CREATE INDEX idx_reservations_created_at ON public.reservations(created_at);

-- Index pour recherche full-text sur les invités
CREATE INDEX idx_reservations_guest_search ON public.reservations 
  USING gin ((
    COALESCE(guest_first_name, '') || ' ' || 
    COALESCE(guest_last_name, '') || ' ' || 
    COALESCE(guest_email, '') || ' ' || 
    COALESCE(guest_structure, '')
  ) gin_trgm_ops);

COMMENT ON TABLE public.reservations IS 'Réservations des programmateurs (connectés ou invités)';
COMMENT ON COLUMN public.reservations.status IS 'confirmed = confirmée, cancelled = annulée, no_show = absent sans annulation';
COMMENT ON COLUMN public.reservations.checkin_status IS 'present_loved = aimé, present_press = presse, present_neutral = neutre, absent = absent';
COMMENT ON COLUMN public.reservations.checkin_internal_notes IS 'Notes internes visibles uniquement par Derviche (super-admin, admin, externe-dd)';

-- ============================================
-- TRIGGERS : Mise à jour automatique de updated_at
-- ============================================

CREATE TRIGGER update_shows_updated_at
  BEFORE UPDATE ON public.shows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON public.slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();