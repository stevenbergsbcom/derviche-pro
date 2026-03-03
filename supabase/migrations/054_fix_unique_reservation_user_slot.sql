-- ============================================
-- Migration 054 : Fix contrainte unicité user_id/slot_id
-- Date: 2026-03-03
-- Session: S135
--
-- PROBLÈME :
--   L'index idx_unique_reservation_user_slot sur (user_id, slot_id) bloque
--   le changement de créneau quand le professionnel a eu une réservation
--   ANNULÉE sur le créneau cible.
--   La contrainte s'appliquait à toutes les réservations, y compris annulées.
--
-- RÈGLE MÉTIER (cohérente avec R-RESA-04 pour les emails) :
--   Une réservation ANNULÉE ne doit pas bloquer une nouvelle réservation
--   sur le même créneau pour le même utilisateur.
--
-- CORRECTION :
--   Remplacer l'index full par un PARTIAL INDEX qui exclut les annulations.
--   Même logique que la vérification email/slot (migrations 023/024/045).
-- ============================================

-- 1. Supprimer l'ancien index sans filtre (s'il existe)
DROP INDEX IF EXISTS public.idx_unique_reservation_user_slot;

-- 2. Recréer en PARTIAL INDEX : exclut les annulées + les guest (user_id NULL)
CREATE UNIQUE INDEX idx_unique_reservation_user_slot
  ON public.reservations (user_id, slot_id)
  WHERE status != 'cancelled'
    AND user_id IS NOT NULL;

COMMENT ON INDEX public.idx_unique_reservation_user_slot IS
  'Empêche un même utilisateur connecté d''avoir deux réservations actives
   sur le même créneau. Les réservations annulées et les réservations guest
   (user_id NULL) sont exclues de cette contrainte.';
