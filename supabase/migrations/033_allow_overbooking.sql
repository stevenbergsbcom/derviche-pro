-- ============================================
-- MIGRATION 033 : Autoriser l'overbooking
-- Derviche Diffusion - Plateforme de réservation
-- 
-- Supprime les contraintes bloquantes sur remaining_capacity
-- pour permettre l'overbooking et le transfert de réservations
-- L'avertissement se fait côté frontend
-- ============================================

-- ============================================
-- 1. SUPPRIMER LES CONTRAINTES BLOQUANTES
-- ============================================

-- Supprimer la contrainte remaining_capacity >= 0
ALTER TABLE public.slots
  DROP CONSTRAINT IF EXISTS slots_remaining_capacity_check;

-- Supprimer la contrainte remaining_capacity <= capacity
-- (bloque le trigger lors de la libération des places)
ALTER TABLE public.slots
  DROP CONSTRAINT IF EXISTS check_remaining_not_exceeds_capacity;

-- ============================================
-- 2. MODIFIER LE TRIGGER update_slot_capacity
-- Ne bloque plus en cas de capacité insuffisante
-- Permet l'overbooking (remaining_capacity négatif)
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
    
    -- Décrémenter la capacité restante (peut devenir négatif = overbooking)
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
      -- Bloquer les places (peut créer de l'overbooking)
      UPDATE public.slots
      SET remaining_capacity = remaining_capacity - NEW.num_places
      WHERE id = NEW.slot_id;
      
      RETURN NEW;
    END IF;
    
    -- Cas 2c : Changement du nombre de places (réservation non annulée)
    IF OLD.num_places != NEW.num_places AND NEW.status != 'cancelled' THEN
      v_capacity_change := NEW.num_places - OLD.num_places;
      
      -- Mettre à jour la capacité (peut devenir négatif = overbooking)
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
      
      -- Bloquer les places du nouveau créneau (peut créer de l'overbooking)
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

COMMENT ON FUNCTION public.update_slot_capacity IS 
  'Gère automatiquement remaining_capacity des slots. Permet l''overbooking (remaining_capacity négatif).';
