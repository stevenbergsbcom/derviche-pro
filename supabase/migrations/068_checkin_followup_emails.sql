-- ============================================
-- Migration 068 : Emails post-checkin
-- Derviche Diffusion - Session S144
-- ============================================
-- 1. Table checkin_followup_emails : tracking des envois post-checkin
-- 2. Colonne is_simple_style dans email_templates
-- 3. 4 nouveaux templates post-checkin en base de données
-- ============================================


-- ============================================
-- 1. TABLE : checkin_followup_emails
-- Trace chaque envoi d'email post-checkin par réservation et type.
-- Permet d'afficher "Déjà envoyé le X" dans l'UI.
-- ============================================

CREATE TABLE public.checkin_followup_emails (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  template_key   TEXT NOT NULL CHECK (template_key IN (
    'checkin_thank_you',
    'checkin_loved',
    'checkin_press',
    'checkin_followup_absent'
  )),
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour requête courante : "quels emails ont été envoyés pour cette réservation ?"
CREATE INDEX idx_checkin_followup_emails_reservation
  ON public.checkin_followup_emails(reservation_id);

CREATE INDEX idx_checkin_followup_emails_sent_at
  ON public.checkin_followup_emails(sent_at);

COMMENT ON TABLE public.checkin_followup_emails
  IS 'Historique des emails post-checkin envoyés par réservation (présent, absent, coup de coeur, presse)';

COMMENT ON COLUMN public.checkin_followup_emails.template_key
  IS 'Clé du template utilisé : checkin_thank_you | checkin_loved | checkin_press | checkin_followup_absent';

COMMENT ON COLUMN public.checkin_followup_emails.sent_by
  IS 'Utilisateur (admin/externe) ayant déclenché l envoi';


-- ============================================
-- RLS : checkin_followup_emails
-- ============================================

ALTER TABLE public.checkin_followup_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkin_followup_emails_select"
  ON public.checkin_followup_emails
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "checkin_followup_emails_insert"
  ON public.checkin_followup_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- ============================================
-- 2. COLONNE : is_simple_style dans email_templates
-- ============================================

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS is_simple_style BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.email_templates.is_simple_style
  IS 'true = style sobre fond blanc texte noir ; false = style graphique avec header bleu Derviche';


-- ============================================
-- 3. TEMPLATES : 4 nouveaux templates post-checkin
-- ============================================

-- Template 1 : Remerciement présence (statut present_neutral)
INSERT INTO public.email_templates (
  template_key,
  name,
  is_simple_style,
  header_title,
  subject,
  intro_text,
  body_text,
  info_text,
  salutation,
  cta_text,
  contact_block_title,
  show_contact_block,
  show_reservation_code,
  is_active
) VALUES (
  'checkin_thank_you',
  'Remerciement présence',
  true,
  'Merci pour votre venue',
  'Merci d''avoir assisté à {{spectacle}}',
  'Bonjour {{prénom}},' || E'\n\n' || 'Merci d''être venu(e) découvrir {{spectacle}} de {{compagnie}}.' || E'\n\n' || 'Nous espérons que cette représentation vous a plu et qu''elle a pu nourrir votre réflexion sur une possible programmation.',
  'Si vous souhaitez en savoir plus sur le spectacle, n''hésitez pas à nous contacter. Nous restons à votre disposition pour toute information complémentaire.',
  '',
  'Bien cordialement,',
  '',
  'Votre contact Derviche Diffusion',
  true,
  false,
  true
);

-- Template 2 : Coup de cœur (statut present_loved)
INSERT INTO public.email_templates (
  template_key,
  name,
  is_simple_style,
  header_title,
  subject,
  intro_text,
  body_text,
  info_text,
  salutation,
  cta_text,
  contact_block_title,
  show_contact_block,
  show_reservation_code,
  is_active
) VALUES (
  'checkin_loved',
  'Coup de coeur',
  true,
  'Une découverte qui vous a touché',
  '{{spectacle}} vous a marqué(e)',
  'Bonjour {{prénom}},' || E'\n\n' || 'Nous avons été très touchés de voir que {{spectacle}} de {{compagnie}} a retenu toute votre attention.' || E'\n\n' || 'Nous serions ravis d''échanger avec vous sur les possibilités de programmation dans votre structure.',
  'Ce spectacle est disponible à la programmation. Nous sommes à votre disposition pour vous transmettre tous les éléments techniques et financiers.',
  '',
  'Dans l''attente de vous lire,',
  '',
  'Votre contact Derviche Diffusion',
  true,
  false,
  true
);

-- Template 3 : Presse (statut present_press)
INSERT INTO public.email_templates (
  template_key,
  name,
  is_simple_style,
  header_title,
  subject,
  intro_text,
  body_text,
  info_text,
  salutation,
  cta_text,
  contact_block_title,
  show_contact_block,
  show_reservation_code,
  is_active
) VALUES (
  'checkin_press',
  'Suivi presse',
  true,
  'Suite à votre venue',
  'Suite à votre venue pour {{spectacle}}',
  'Bonjour {{prénom}},' || E'\n\n' || 'Merci d''avoir assisté à la représentation de {{spectacle}} de {{compagnie}}.' || E'\n\n' || 'Nous espérons que vous avez pu emporter tous les éléments utiles pour votre article. N''hésitez pas à nous solliciter si vous avez besoin d''informations complémentaires, de visuels supplémentaires ou d''un entretien avec la compagnie.',
  '',
  '',
  'Bien cordialement,',
  '',
  'Votre contact Derviche Diffusion',
  true,
  false,
  true
);

-- Template 4 : Suivi absence (statut absent)
INSERT INTO public.email_templates (
  template_key,
  name,
  is_simple_style,
  header_title,
  subject,
  intro_text,
  body_text,
  info_text,
  salutation,
  cta_text,
  contact_block_title,
  show_contact_block,
  show_reservation_code,
  is_active
) VALUES (
  'checkin_followup_absent',
  'Suivi absence',
  true,
  'Nous vous avions attendu(e)',
  'Suite à votre absence — {{spectacle}}',
  'Bonjour {{prénom}},' || E'\n\n' || 'Nous avons noté votre absence à la représentation de {{spectacle}} de {{compagnie}} le {{date}} à {{heure}}.' || E'\n\n' || 'Nous espérons que tout va bien de votre côté. Si vous souhaitez découvrir ce spectacle à une prochaine occasion, n''hésitez pas à nous contacter.',
  '',
  '',
  'Bien cordialement,',
  '',
  'Votre contact Derviche Diffusion',
  true,
  false,
  true
);
