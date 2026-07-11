-- ============================================
-- Migration 128: Autoriser les réservations admin sur créneau passé
-- Derviche Diffusion
-- Date: 2026-07-11
-- ============================================
-- CONTEXTE :
-- La fonctionnalité « rattrapage sur représentation passée » (dialog admin
-- « Nouvelle réservation » + PWA walk-in) permet à un staff Derviche
-- d'enregistrer a posteriori une réservation oubliée sur une représentation
-- d'un jour antérieur. L'UI et les RPC ont bien été ouvertes, MAIS le trigger
-- BEFORE INSERT `validate_reservation()` (migration 007) rejette encore tout
-- INSERT dont `slot.date < CURRENT_DATE` avec « Impossible de réserver un
-- créneau passé » → le rattrapage échoue à l'enregistrement. Retour client.
--
-- CORRECTION :
-- On relâche le garde de date UNIQUEMENT pour les réservations admin
-- (`NEW.source = 'admin'`), posé par `create_admin_reservation` (dialog admin
-- ET PWA walk-in). Les réservations publiques (`source = 'public'`, défaut
-- NOT NULL de la colonne, y compris le mode compagnie via le formulaire
-- public) restent bloquées sur les dates passées → aucun risque qu'un pro se
-- mette à réserver de vieilles dates depuis le site public.
--
-- Cas « créneau passé même jour » (heure dépassée) : inchangé — il a
-- `date = CURRENT_DATE` (pas `< CURRENT_DATE`), le garde ne l'a jamais visé.
--
-- PORTÉE :
-- - CREATE OR REPLACE de la fonction trigger uniquement. Le trigger reste
--   lié par son nom (pattern déjà utilisé en migration 007). Additive, aucune
--   autre logique modifiée (null check, draft, max_reservations_per_booking
--   conservés à l'identique).
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

  -- Vérifier que le slot et le spectacle existent
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

  -- Vérifier que le créneau n'est pas dans le passé — SAUF pour les
  -- réservations admin (rattrapage a posteriori, migration 128). Les résa
  -- publiques (source = 'public') restent bloquées sur les dates passées.
  IF v_slot_date < CURRENT_DATE AND NEW.source <> 'admin' THEN
    RAISE EXCEPTION 'Impossible de réserver un créneau passé';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.validate_reservation IS
  'Trigger BEFORE INSERT sur reservations : valide slot/spectacle existants, '
  'statut non-draft, max_reservations_per_booking, et date non passée. '
  'Le garde de date passée est levé pour source = ''admin'' (rattrapage '
  'représentation passée, migration 128) ; les résa publiques restent bloquées.';
