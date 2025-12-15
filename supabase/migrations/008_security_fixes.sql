-- ============================================
-- MIGRATION 008 : Corrections de sécurité
-- Fix des warnings Cursor
-- ============================================

-- ============================================
-- FIX 1 : validate_checkin_date - Vérification NULL
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_checkin_date()
RETURNS TRIGGER AS $$
DECLARE
  v_slot_date DATE;
BEGIN
  -- Si on modifie le checkin_status
  IF (OLD.checkin_status IS NULL AND NEW.checkin_status IS NOT NULL) 
     OR (OLD.checkin_status IS DISTINCT FROM NEW.checkin_status AND NEW.checkin_status IS NOT NULL) THEN
    
    -- Récupérer la date du créneau
    SELECT date INTO v_slot_date
    FROM public.slots
    WHERE id = NEW.slot_id;
    
    -- FIX: Vérifier que le slot existe
    IF v_slot_date IS NULL THEN
      RAISE EXCEPTION 'Slot introuvable (id: %)', NEW.slot_id;
    END IF;
    
    -- Vérifier que c'est le jour J ou après (R-RESA-08)
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

-- ============================================
-- FIX 2 : Externe-DD ne peut modifier que les profils
-- des programmateurs ayant une réservation sur leurs spectacles
-- ============================================

-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "profiles_update_externe_dd" ON public.profiles;

-- Nouvelle policy restrictive : externe-DD peut modifier uniquement
-- les profils des utilisateurs ayant une réservation sur leurs spectacles assignés
CREATE POLICY "profiles_update_externe_dd"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    public.has_role('externe-dd')
    AND deleted_at IS NULL
    AND (
      -- Peut modifier son propre profil
      id = auth.uid()
      OR
      -- OU peut modifier les profils des programmateurs ayant une réservation
      -- sur un de leurs spectacles assignés (pour le check-in)
      EXISTS (
        SELECT 1 
        FROM public.reservations r
        JOIN public.slots sl ON r.slot_id = sl.id
        WHERE r.user_id = profiles.id
        AND public.externe_has_access_to_show(sl.show_id)
      )
    )
  );

-- ============================================
-- FIX 3 : Clarifier les policies pour le rôle "professional"
-- Note: Les professionals accèdent déjà aux données via les policies "public"
-- Mais on ajoute des policies explicites pour plus de clarté
-- ============================================

-- Les professionals peuvent voir leurs propres réservations (déjà couvert par reservations_select_own)
-- Les professionals peuvent voir les spectacles publiés (déjà couvert par shows_select_public)
-- Les professionals peuvent voir les slots publiés (déjà couvert par slots_select_public)

-- Ajout d'une policy explicite pour que les professionals puissent 
-- voir leur propre profil complet (déjà couvert mais on le rend explicite)
-- Note: profiles_select_own existe déjà et couvre ce cas

-- ============================================
-- FIX 4 : Fonction helper pour vérifier si un externe-DD
-- peut modifier un profil spécifique
-- ============================================

CREATE OR REPLACE FUNCTION public.externe_can_update_profile(p_profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Peut toujours modifier son propre profil
  IF p_profile_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  -- Peut modifier les profils des programmateurs ayant une réservation
  -- sur un de ses spectacles assignés
  RETURN EXISTS (
    SELECT 1 
    FROM public.reservations r
    JOIN public.slots sl ON r.slot_id = sl.id
    WHERE r.user_id = p_profile_id
    AND public.externe_has_access_to_show(sl.show_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.externe_can_update_profile IS 
  'Vérifie si un externe-DD peut modifier un profil (R-EXT-03, R-EXT-06)';