-- ============================================
-- Migration 057 - Table admin_notifications
-- Date: 2026-03-04
-- Objectif: Créer la table des notifications admin (nouvelle réservation,
--           annulation, modification) affichées via badge + popover sidebar.
--
-- Décisions d'architecture :
--   - Données dénormalisées (professional_name, show_title, slot_date)
--     pour éviter les JOINs à chaque affichage du badge
--   - reservation_id FK nullable (ON DELETE SET NULL) : la notif reste
--     lisible même si la réservation est supprimée
--   - INSERT uniquement via service role (routes API) → pas de policy INSERT
--     pour authenticated
--   - Lecture lu/non-lu individuelle gérée dans migration 058
-- ============================================

-- ============================================
-- TABLE
-- ============================================

CREATE TABLE public.admin_notifications (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT        NOT NULL
    CHECK (type IN ('new_reservation', 'cancellation', 'modification')),
  reservation_id    UUID        REFERENCES public.reservations(id) ON DELETE SET NULL,
  professional_name TEXT        NOT NULL,
  show_title        TEXT        NOT NULL,
  slot_date         TIMESTAMPTZ,
  message           TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEX
-- ============================================

-- Tri chronologique inversé (affichage du popover)
CREATE INDEX idx_admin_notifications_created_at
  ON public.admin_notifications(created_at DESC);

-- Recherche par réservation (ex. dépilage lors d'une annulation)
CREATE INDEX idx_admin_notifications_reservation_id
  ON public.admin_notifications(reservation_id);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- SELECT : admin et super-admin uniquement
CREATE POLICY "admin_notifications_select_admin"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super());

-- DELETE : super-admin uniquement (purge manuelle si besoin)
CREATE POLICY "admin_notifications_delete_super_admin"
  ON public.admin_notifications FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- INSERT / UPDATE : service role uniquement (pas de policy → seul le service
-- role Supabase peut insérer, via les routes API Next.js côté serveur)
