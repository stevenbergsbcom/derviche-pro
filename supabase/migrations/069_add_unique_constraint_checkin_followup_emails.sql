-- ============================================
-- Migration 069 : Contrainte UNIQUE checkin_followup_emails
-- Derviche Diffusion - Session S146 (correctif post-068)
-- ============================================
-- La migration 068 a été appliquée en prod sans cette contrainte.
-- Ce correctif l'ajoute : 1 seul enregistrement par réservation + type d'email.
-- ============================================

-- Supprimer les éventuels doublons existants avant d'ajouter la contrainte
-- (garde le plus ancien enregistrement pour chaque paire reservation_id / template_key)
DELETE FROM public.checkin_followup_emails
WHERE id NOT IN (
  SELECT DISTINCT ON (reservation_id, template_key) id
  FROM public.checkin_followup_emails
  ORDER BY reservation_id, template_key, sent_at ASC
);

-- Ajouter la contrainte UNIQUE
ALTER TABLE public.checkin_followup_emails
  ADD CONSTRAINT checkin_followup_emails_reservation_template_key
  UNIQUE (reservation_id, template_key);

COMMENT ON CONSTRAINT checkin_followup_emails_reservation_template_key
  ON public.checkin_followup_emails
  IS 'Un seul enregistrement par réservation et par type d''email post-checkin';
