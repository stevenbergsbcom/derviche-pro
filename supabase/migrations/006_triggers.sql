-- ============================================
-- MIGRATION 006 : Triggers et Contraintes
-- Derviche Diffusion - Plateforme de réservation
-- VERSION CORRIGÉE - Toutes les règles métier
-- ============================================

-- ============================================
-- CONTRAINTE R-RESA-04 : Un email ne peut avoir 
-- qu'une seule réservation par créneau
-- ============================================

-- Index unique partiel pour utilisateurs connectés (user_id + slot_id)
CREATE UNIQUE INDEX idx_unique_reservation_user_slot 
  ON public.reservations (user_id, slot_id)
  WHERE user_id IS NOT NULL AND status != 'cancelled';

-- Index unique partiel pour invités (guest_email + slot_id)
CREATE UNIQUE INDEX idx_unique_reservation_guest_slot 
  ON public.reservations (guest_email, slot_id)
  WHERE guest_email IS NOT NULL AND status != 'cancelled';

-- ============================================
-- TRIGGER : Gestion automatique de remaining_capacity
-- CORRIGÉ : Gère INSERT, UPDATE (changement num_places), DELETE
-- ============================================

CREATE OR REPLACE FUNCTION public.update_slot_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_capacity_change INTEGER;
  v_slot_capacity INTEGER;
  v_slot_remaining INTEGER;
BEGIN
  -- ========================================
  -- CAS 1 : INSERT (nouvelle réservation)
  -- ========================================
  IF TG_OP = 'INSERT' THEN
    -- Ne rien faire si la réservation est déjà annulée
    IF NEW.status = 'cancelled' THEN
      RETURN NEW;
    END IF;
    
    -- Vérifier qu'il y a assez de places (R-RESA-01)
    SELECT remaining_capacity INTO v_slot_remaining
    FROM public.slots
    WHERE id = NEW.slot_id
    FOR UPDATE; -- Lock pour éviter les race conditions
    
    IF v_slot_remaining < NEW.num_places THEN
      RAISE EXCEPTION 'Pas assez de places disponibles. Demandé: %, Disponible: %', 
        NEW.num_places, v_slot_remaining;
    END IF;
    
    -- Décrémenter la capacité restante
    UPDATE public.slots
    SET remaining_capacity = remaining_capacity - NEW.num_places
    WHERE id = NEW.slot_id;
    
    RETURN NEW;
  END IF;
  
  -- ========================================
  -- CAS 2 : UPDATE (modification de réservation)
  -- ========================================
  IF TG_OP = 'UPDATE' THEN
    -- Cas 2a : Changement de statut vers "cancelled" (R-RESA-07)
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
      -- Libérer les places
      UPDATE public.slots
      SET remaining_capacity = remaining_capacity + OLD.num_places
      WHERE id = OLD.slot_id;
      
      RETURN NEW;
    END IF;
    
    -- Cas 2b : Réactivation d'une réservation annulée
    IF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
      -- Vérifier qu'il y a assez de places
      SELECT remaining_capacity INTO v_slot_remaining
      FROM public.slots
      WHERE id = NEW.slot_id
      FOR UPDATE;
      
      IF v_slot_remaining < NEW.num_places THEN
        RAISE EXCEPTION 'Pas assez de places disponibles pour réactiver. Demandé: %, Disponible: %', 
          NEW.num_places, v_slot_remaining;
      END IF;
      
      -- Bloquer les places
      UPDATE public.slots
      SET remaining_capacity = remaining_capacity - NEW.num_places
      WHERE id = NEW.slot_id;
      
      RETURN NEW;
    END IF;
    
    -- Cas 2c : Changement du nombre de places (réservation non annulée)
    IF OLD.num_places != NEW.num_places AND NEW.status != 'cancelled' THEN
      v_capacity_change := NEW.num_places - OLD.num_places;
      
      -- Si on augmente le nombre de places, vérifier la disponibilité
      IF v_capacity_change > 0 THEN
        SELECT remaining_capacity INTO v_slot_remaining
        FROM public.slots
        WHERE id = NEW.slot_id
        FOR UPDATE;
        
        IF v_slot_remaining < v_capacity_change THEN
          RAISE EXCEPTION 'Pas assez de places pour augmenter la réservation. Demandé: +%, Disponible: %', 
            v_capacity_change, v_slot_remaining;
        END IF;
      END IF;
      
      -- Mettre à jour la capacité (+ si on réduit, - si on augmente)
      UPDATE public.slots
      SET remaining_capacity = remaining_capacity - v_capacity_change
      WHERE id = NEW.slot_id;
      
      RETURN NEW;
    END IF;
    
    -- Cas 2d : Changement de créneau (slot_id différent)
    IF OLD.slot_id != NEW.slot_id AND NEW.status != 'cancelled' THEN
      -- Libérer les places de l'ancien créneau
      IF OLD.status != 'cancelled' THEN
        UPDATE public.slots
        SET remaining_capacity = remaining_capacity + OLD.num_places
        WHERE id = OLD.slot_id;
      END IF;
      
      -- Vérifier et bloquer les places du nouveau créneau
      SELECT remaining_capacity INTO v_slot_remaining
      FROM public.slots
      WHERE id = NEW.slot_id
      FOR UPDATE;
      
      IF v_slot_remaining < NEW.num_places THEN
        RAISE EXCEPTION 'Pas assez de places sur le nouveau créneau. Demandé: %, Disponible: %', 
          NEW.num_places, v_slot_remaining;
      END IF;
      
      UPDATE public.slots
      SET remaining_capacity = remaining_capacity - NEW.num_places
      WHERE id = NEW.slot_id;
      
      RETURN NEW;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- ========================================
  -- CAS 3 : DELETE (suppression de réservation)
  -- ========================================
  IF TG_OP = 'DELETE' THEN
    -- Libérer les places uniquement si la réservation n'était pas annulée
    IF OLD.status != 'cancelled' THEN
      UPDATE public.slots
      SET remaining_capacity = remaining_capacity + OLD.num_places
      WHERE id = OLD.slot_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_slot_capacity ON public.reservations;
CREATE TRIGGER trigger_update_slot_capacity
  AFTER INSERT OR UPDATE OR DELETE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_slot_capacity();

COMMENT ON FUNCTION public.update_slot_capacity IS 
  'Gère automatiquement remaining_capacity des slots lors des opérations sur reservations';

-- ============================================
-- TRIGGER : Initialiser remaining_capacity = capacity
-- lors de la création d'un slot
-- ============================================

CREATE OR REPLACE FUNCTION public.init_slot_remaining_capacity()
RETURNS TRIGGER AS $$
BEGIN
  -- Si remaining_capacity n'est pas spécifié, l'initialiser à capacity
  IF NEW.remaining_capacity IS NULL THEN
    NEW.remaining_capacity := NEW.capacity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_init_slot_capacity ON public.slots;
CREATE TRIGGER trigger_init_slot_capacity
  BEFORE INSERT ON public.slots
  FOR EACH ROW
  EXECUTE FUNCTION public.init_slot_remaining_capacity();

-- ============================================
-- TRIGGER R-SLOT-04 : Date créneau dans le futur
-- (lors de la création uniquement)
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_slot_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que la date est dans le futur (ou aujourd'hui)
  IF NEW.date < CURRENT_DATE THEN
    RAISE EXCEPTION 'La date du créneau (%) doit être aujourd''hui ou dans le futur', NEW.date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_slot_date ON public.slots;
CREATE TRIGGER trigger_validate_slot_date
  BEFORE INSERT ON public.slots
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_slot_date();

-- ============================================
-- TRIGGER R-SLOT-03 : Empêcher suppression créneau
-- avec des réservations confirmées
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_slot_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_confirmed_count INTEGER;
BEGIN
  -- Compter les réservations confirmées sur ce créneau
  SELECT COUNT(*) INTO v_confirmed_count
  FROM public.reservations
  WHERE slot_id = OLD.id
  AND status = 'confirmed';
  
  IF v_confirmed_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer ce créneau : % réservation(s) confirmée(s)', 
      v_confirmed_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_slot_deletion ON public.slots;
CREATE TRIGGER trigger_prevent_slot_deletion
  BEFORE DELETE ON public.slots
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_slot_deletion();

-- ============================================
-- TRIGGER : Générer automatiquement le slug du spectacle
-- (R-SHOW-02)
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_show_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Générer le slug de base à partir du titre
  base_slug := public.generate_slug(NEW.title);
  final_slug := base_slug;
  
  -- Si le slug existe déjà, ajouter un suffixe numérique
  WHILE EXISTS (
    SELECT 1 FROM public.shows 
    WHERE slug = final_slug 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_show_slug ON public.shows;
CREATE TRIGGER trigger_generate_show_slug
  BEFORE INSERT OR UPDATE OF title ON public.shows
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_show_slug();

-- ============================================
-- TRIGGER : Générer automatiquement le slug de catégorie
-- (R-CAT-02)
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Générer le slug à partir du nom si non fourni
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_category_slug ON public.show_categories;
CREATE TRIGGER trigger_generate_category_slug
  BEFORE INSERT OR UPDATE OF name ON public.show_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_category_slug();

-- ============================================
-- TRIGGER : Créer automatiquement un profil
-- quand un utilisateur s'inscrit via auth.users
-- (R-USER-03 : Les programmateurs peuvent s'inscrire eux-mêmes)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  
  -- Par défaut, assigner le rôle "professional" (R-USER-03)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'professional');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users (schéma auth de Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER : Mettre cancelled_at lors d'une annulation
-- ============================================

CREATE OR REPLACE FUNCTION public.set_cancelled_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    NEW.cancelled_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_cancelled_at ON public.reservations;
CREATE TRIGGER trigger_set_cancelled_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_cancelled_at();

-- ============================================
-- TRIGGER R-RESA-08 : Check-in uniquement jour J ou après
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_checkin_date()
RETURNS TRIGGER AS $$
DECLARE
  v_slot_date DATE;
BEGIN
  -- Si on modifie le checkin_status (passage de NULL à une valeur)
  IF (OLD.checkin_status IS NULL AND NEW.checkin_status IS NOT NULL) 
     OR (OLD.checkin_status IS DISTINCT FROM NEW.checkin_status AND NEW.checkin_status IS NOT NULL) THEN
    
    -- Récupérer la date du créneau
    SELECT date INTO v_slot_date
    FROM public.slots
    WHERE id = NEW.slot_id;
    
    -- Vérifier que c'est le jour J ou après
    IF v_slot_date > CURRENT_DATE THEN
      RAISE EXCEPTION 'Le check-in ne peut être effectué qu''à partir du jour de la représentation (%). Aujourd''hui: %', 
        v_slot_date, CURRENT_DATE;
    END IF;
    
    -- Mettre à jour checkin_at automatiquement
    NEW.checkin_at := NOW();
    NEW.checkin_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_checkin_date ON public.reservations;
CREATE TRIGGER trigger_validate_checkin_date
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_checkin_date();

-- ============================================
-- CONTRAINTES ADDITIONNELLES
-- ============================================

-- R-SLOT-01 & R-SLOT-02 : remaining_capacity >= 0 et <= capacity
ALTER TABLE public.slots
  DROP CONSTRAINT IF EXISTS check_remaining_not_exceeds_capacity;
  
ALTER TABLE public.slots
  ADD CONSTRAINT check_remaining_not_exceeds_capacity
  CHECK (remaining_capacity >= 0 AND remaining_capacity <= capacity);

-- ============================================
-- FONCTION : Vérifier les règles métier avant réservation
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_reservation()
RETURNS TRIGGER AS $$
DECLARE
  v_max_per_booking INTEGER;
  v_show_status TEXT;
  v_slot_date DATE;
  v_user_email TEXT;
  v_existing_reservation UUID;
BEGIN
  -- Récupérer les infos du spectacle via le slot
  SELECT 
    s.max_reservations_per_booking,
    s.status,
    sl.date
  INTO 
    v_max_per_booking,
    v_show_status,
    v_slot_date
  FROM public.slots sl
  JOIN public.shows s ON sl.show_id = s.id
  WHERE sl.id = NEW.slot_id;
  
  -- R-SHOW-06 : Un spectacle "draft" ne peut pas recevoir de réservations publiques
  IF v_show_status = 'draft' THEN
    RAISE EXCEPTION 'Ce spectacle n''est pas encore publié';
  END IF;
  
  -- R-SHOW-05 : Vérifier max_reservations_per_booking
  IF NEW.num_places > v_max_per_booking THEN
    RAISE EXCEPTION 'Nombre de places demandé (%) dépasse le maximum autorisé (%)', 
      NEW.num_places, v_max_per_booking;
  END IF;
  
  -- Vérifier que le créneau n'est pas dans le passé
  IF v_slot_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Impossible de réserver un créneau passé';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_reservation ON public.reservations;
CREATE TRIGGER trigger_validate_reservation
  BEFORE INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_reservation();

-- ============================================
-- TRIGGER R-SHOW-03 : Empêcher la suppression d'un spectacle
-- avec des réservations confirmées
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_show_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_confirmed_count INTEGER;
BEGIN
  -- Compter les réservations confirmées
  SELECT COUNT(*) INTO v_confirmed_count
  FROM public.reservations r
  JOIN public.slots sl ON r.slot_id = sl.id
  WHERE sl.show_id = OLD.id
  AND r.status = 'confirmed';
  
  IF v_confirmed_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer ce spectacle : % réservation(s) confirmée(s)', 
      v_confirmed_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_show_deletion ON public.shows;
CREATE TRIGGER trigger_prevent_show_deletion
  BEFORE DELETE ON public.shows
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_show_deletion();

-- ============================================
-- TRIGGER R-CAT-01 : Empêcher la suppression d'une catégorie
-- avec des spectacles associés
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_category_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_show_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_show_count
  FROM public.show_category_mapping
  WHERE category_id = OLD.id;
  
  IF v_show_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer cette catégorie : % spectacle(s) associé(s)', 
      v_show_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_category_deletion ON public.show_categories;
CREATE TRIGGER trigger_prevent_category_deletion
  BEFORE DELETE ON public.show_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_category_deletion();

-- ============================================
-- FONCTION UTILITAIRE : Vérifier si un externe-DD
-- peut faire le check-in sur un créneau (R-EXT-02)
-- ============================================

CREATE OR REPLACE FUNCTION public.externe_can_checkin(p_slot_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_show_id UUID;
  v_hosted_by TEXT;
BEGIN
  -- Récupérer le show_id et hosted_by du slot
  SELECT show_id, hosted_by INTO v_show_id, v_hosted_by
  FROM public.slots
  WHERE id = p_slot_id;
  
  -- Vérifier que l'externe a accès au spectacle
  IF NOT public.externe_has_access_to_show(v_show_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier que hosted_by = 'derviche' (R-EXT-02)
  IF v_hosted_by != 'derviche' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.externe_can_checkin IS 
  'Vérifie si un externe-DD peut faire le check-in sur un créneau (R-EXT-02)';