-- ============================================
-- MIGRATION 007 : Fix NULL checks in triggers
-- Amélioration de robustesse des triggers
-- ============================================

-- ============================================
-- FIX 1 : update_slot_capacity - Vérification NULL
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
    IF NEW.status = 'cancelled' THEN
      RETURN NEW;
    END IF;
    
    SELECT remaining_capacity INTO v_slot_remaining
    FROM public.slots
    WHERE id = NEW.slot_id
    FOR UPDATE;
    
    -- FIX: Vérifier que le slot existe
    IF v_slot_remaining IS NULL THEN
      RAISE EXCEPTION 'Slot introuvable (id: %)', NEW.slot_id;
    END IF;
    
    IF v_slot_remaining < NEW.num_places THEN
      RAISE EXCEPTION 'Pas assez de places disponibles. Demandé: %, Disponible: %', 
        NEW.num_places, v_slot_remaining;
    END IF;
    
    UPDATE public.slots
    SET remaining_capacity = remaining_capacity - NEW.num_places
    WHERE id = NEW.slot_id;
    
    RETURN NEW;
  END IF;
  
  -- ========================================
  -- CAS 2 : UPDATE (modification de réservation)
  -- ========================================
  IF TG_OP = 'UPDATE' THEN
    -- Cas 2a : Changement de statut vers "cancelled"
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
      UPDATE public.slots
      SET remaining_capacity = remaining_capacity + OLD.num_places
      WHERE id = OLD.slot_id;
      
      RETURN NEW;
    END IF;
    
    -- Cas 2b : Réactivation d'une réservation annulée
    IF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
      SELECT remaining_capacity INTO v_slot_remaining
      FROM public.slots
      WHERE id = NEW.slot_id
      FOR UPDATE;
      
      IF v_slot_remaining IS NULL THEN
        RAISE EXCEPTION 'Slot introuvable (id: %)', NEW.slot_id;
      END IF;
      
      IF v_slot_remaining < NEW.num_places THEN
        RAISE EXCEPTION 'Pas assez de places disponibles pour réactiver. Demandé: %, Disponible: %', 
          NEW.num_places, v_slot_remaining;
      END IF;
      
      UPDATE public.slots
      SET remaining_capacity = remaining_capacity - NEW.num_places
      WHERE id = NEW.slot_id;
      
      RETURN NEW;
    END IF;
    
    -- Cas 2c : Changement du nombre de places
    IF OLD.num_places != NEW.num_places AND NEW.status != 'cancelled' THEN
      v_capacity_change := NEW.num_places - OLD.num_places;
      
      IF v_capacity_change > 0 THEN
        SELECT remaining_capacity INTO v_slot_remaining
        FROM public.slots
        WHERE id = NEW.slot_id
        FOR UPDATE;
        
        IF v_slot_remaining IS NULL THEN
          RAISE EXCEPTION 'Slot introuvable (id: %)', NEW.slot_id;
        END IF;
        
        IF v_slot_remaining < v_capacity_change THEN
          RAISE EXCEPTION 'Pas assez de places pour augmenter la réservation. Demandé: +%, Disponible: %', 
            v_capacity_change, v_slot_remaining;
        END IF;
      END IF;
      
      UPDATE public.slots
      SET remaining_capacity = remaining_capacity - v_capacity_change
      WHERE id = NEW.slot_id;
      
      RETURN NEW;
    END IF;
    
    -- Cas 2d : Changement de créneau
    IF OLD.slot_id != NEW.slot_id AND NEW.status != 'cancelled' THEN
      IF OLD.status != 'cancelled' THEN
        UPDATE public.slots
        SET remaining_capacity = remaining_capacity + OLD.num_places
        WHERE id = OLD.slot_id;
      END IF;
      
      SELECT remaining_capacity INTO v_slot_remaining
      FROM public.slots
      WHERE id = NEW.slot_id
      FOR UPDATE;
      
      IF v_slot_remaining IS NULL THEN
        RAISE EXCEPTION 'Nouveau slot introuvable (id: %)', NEW.slot_id;
      END IF;
      
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
  -- CAS 3 : DELETE
  -- ========================================
  IF TG_OP = 'DELETE' THEN
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

-- ============================================
-- FIX 2 : validate_reservation - Vérification NULL
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_reservation()
RETURNS TRIGGER AS $$
DECLARE
  v_max_per_booking INTEGER;
  v_show_status TEXT;
  v_slot_date DATE;
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
  
  -- FIX: Vérifier que le slot et le spectacle existent
  IF v_max_per_booking IS NULL OR v_show_status IS NULL OR v_slot_date IS NULL THEN
    RAISE EXCEPTION 'Slot ou spectacle introuvable (slot_id: %)', NEW.slot_id;
  END IF;
  
  -- R-SHOW-06 : Un spectacle "draft" ne peut pas recevoir de réservations
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