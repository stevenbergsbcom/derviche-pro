-- ============================================
-- Migration 075: Index composite (slot_id, status) sur reservations
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-03-09
-- ============================================
-- POURQUOI :
--   Plusieurs requêtes fréquentes filtrent à la fois sur slot_id ET status :
--     - Le trigger update_slot_capacity vérifie les réservations par slot
--     - Les RPCs de checkin (PWA) filtrent remaining_capacity par slot
--     - L'admin filtre les réservations confirmées/annulées par créneau
--     - Le trigger prevent_slot_deletion compte les réservations confirmées
--
--   Les index individuels idx_reservations_slot(slot_id) et
--   idx_reservations_status(status) existent déjà, mais PostgreSQL doit
--   faire une intersection de deux scans bitmap pour les requêtes combinées.
--   Un index composite est plus efficace pour ces patterns.
--
-- INDEX PARTIEL (WHERE status != 'cancelled') :
--   Les réservations annulées ne sont presque jamais interrogées en jointure
--   avec slot_id (sauf export/stats). L'index partiel est plus petit et plus
--   rapide pour les requêtes opérationnelles du quotidien.
--
-- L'index existant idx_reservations_slot reste utile pour les requêtes
-- qui ne filtrent pas par status (ex: chargement d'une réservation par slot
-- sans filtre de statut), donc on ne le supprime pas.
-- ============================================

-- Index composite partiel : requêtes opérationnelles (hors annulées)
CREATE INDEX IF NOT EXISTS idx_reservations_slot_status_active
  ON public.reservations (slot_id, status)
  WHERE status != 'cancelled';

-- Index composite complet : statistiques / exports / triggers
-- (le trigger prevent_slot_deletion filtre WHERE status = 'confirmed')
CREATE INDEX IF NOT EXISTS idx_reservations_slot_confirmed
  ON public.reservations (slot_id)
  WHERE status = 'confirmed';

COMMENT ON INDEX idx_reservations_slot_status_active IS
  'Index composite pour les requêtes fréquentes slot_id + status (hors annulées)';

COMMENT ON INDEX idx_reservations_slot_confirmed IS
  'Index partiel pour le comptage des réservations confirmées par créneau (trigger prevent_slot_deletion)';
