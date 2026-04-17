-- ============================================
-- Migration 110 : Bloc « Gérer ma réservation » dans l'email de confirmation
-- Derviche Diffusion
-- ============================================
-- Ajoute 3 colonnes sur email_templates pour piloter un nouveau bloc
-- conditionnel affiché sous le CTA principal dans le template
-- `reservation_confirmation`. Le bloc a deux variantes :
--   • Compte pro (reservation.user_id non null) → bouton vers /professional/reservations
--   • Guest     (reservation.user_id null)     → paragraphe + bouton mailto
--
-- Défaut false → aucun template existant n'en bénéficie tant qu'un admin
-- ne l'active depuis /admin/preferences. Merge-safe.
-- ============================================

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS show_manage_reservation_link BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manage_reservation_link_text TEXT    NOT NULL
    DEFAULT 'Annuler ou modifier ma réservation',
  ADD COLUMN IF NOT EXISTS guest_contact_message        TEXT    NOT NULL
    DEFAULT 'Pour modifier ou annuler votre réservation, contactez-nous ci-dessous.';

COMMENT ON COLUMN public.email_templates.show_manage_reservation_link
  IS 'Si true, ajoute un bloc « Gérer ma réservation » après le CTA principal (bouton compte pro ou message + mailto guest).';
COMMENT ON COLUMN public.email_templates.manage_reservation_link_text
  IS 'Libellé du bouton « gérer ma réservation » pour les utilisateurs connectés (reservations avec user_id non null).';
COMMENT ON COLUMN public.email_templates.guest_contact_message
  IS 'Message intro affiché aux guests (sans compte) avant le bouton mailto de contact.';
