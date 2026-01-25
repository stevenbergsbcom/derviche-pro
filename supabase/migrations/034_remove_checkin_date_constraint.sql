-- ============================================
-- MIGRATION 034 : Supprimer la contrainte de date pour le check-in
-- Derviche Diffusion
-- 
-- Permet de modifier le checkin_status sur les créneaux
-- passés, actuels ET futurs (pré-enregistrement possible)
-- ============================================

-- Supprimer le trigger de validation de date de check-in
DROP TRIGGER IF EXISTS trigger_validate_checkin_date ON public.reservations;

-- Supprimer la fonction associée
DROP FUNCTION IF EXISTS public.validate_checkin_date();

-- Recréer une version simplifiée qui met juste à jour checkin_at et checkin_by
-- sans vérifier la date
CREATE OR REPLACE FUNCTION public.update_checkin_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Si on modifie le checkin_status (passage de NULL à une valeur ou changement)
  IF (OLD.checkin_status IS NULL AND NEW.checkin_status IS NOT NULL) 
     OR (OLD.checkin_status IS DISTINCT FROM NEW.checkin_status AND NEW.checkin_status IS NOT NULL) THEN
    
    -- Mettre à jour checkin_at automatiquement
    NEW.checkin_at := NOW();
    
    -- Mettre à jour checkin_by si non déjà défini par l'application
    IF NEW.checkin_by IS NULL THEN
      NEW.checkin_by := auth.uid();
    END IF;
  END IF;
  
  -- Si on remet checkin_status à NULL (reset), on garde les métadonnées
  -- pour l'historique (qui a fait le dernier check-in)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_update_checkin_metadata
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_checkin_metadata();

COMMENT ON FUNCTION public.update_checkin_metadata IS 
  'Met à jour automatiquement checkin_at et checkin_by lors du pointage (sans contrainte de date)';
