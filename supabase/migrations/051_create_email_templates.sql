-- ============================================
-- Migration 051 - Table email_templates
-- Date: 2026-03-03
-- Objectif: Système de templates email éditables par l'admin
--
-- Architecture Option C :
--   - Structure HTML fixe dans le code (maintenue par développeur)
--   - Contenu textuel éditable par super-admin via l'UI admin
--
-- Champs éditables par template :
--   header_title         : titre principal dans l'en-tête coloré
--   subject              : objet du mail
--   intro_text           : texte avant le récapitulatif
--   body_text            : texte après le récapitulatif
--   info_text            : texte bloc informatif (📧) — si vide, bloc masqué
--   salutation           : formule de politesse avant la signature ("À très bientôt,")
--   cta_text             : texte du bouton CTA principal
--   contact_block_title  : titre du bloc contact Derviche
--   show_contact_block   : toggle afficher/masquer le bloc contact
--   show_reservation_code: toggle afficher/masquer le code de réservation
--
-- Champs globaux (restent dans app_settings) :
--   email_signature   : signature commune à tous les mails
--   email_footer_text : pied de page commun à tous les mails
--
-- Variables disponibles dans tous les champs texte :
--   {{prénom}}       → prénom du professionnel
--   {{nom}}          → nom du professionnel
--   {{spectacle}}    → titre du spectacle
--   {{date}}         → date formatée du créneau
--   {{heure}}        → heure formatée du créneau
--   {{lieu}}         → nom du lieu
--   {{code}}         → code de réservation
--   {{organisation}} → organization_name depuis app_settings
--
-- Templates :
--   reservation_confirmation  — email pro après réservation
--   reservation_cancellation  — email pro après annulation
--   reservation_modification  — email pro après changement créneau
--   admin_notification        — email interne manager Derviche
--
-- Migration des sujets :
--   Les clés email_confirmation_subject et email_cancellation_subject
--   sont migrées ici depuis app_settings et supprimées de cette table.
-- ============================================

-- ============================================
-- 1. CRÉATION DE LA TABLE
-- ============================================

CREATE TABLE public.email_templates (
  id                    uuid         NOT NULL DEFAULT gen_random_uuid(),
  template_key          varchar(100) NOT NULL,
  name                  varchar(255) NOT NULL,
  -- En-tête
  header_title          varchar(200) NOT NULL DEFAULT '',
  -- Contenu
  subject               varchar(500) NOT NULL,
  intro_text            text         NOT NULL DEFAULT '',
  body_text             text         NOT NULL DEFAULT '',
  info_text             text         NOT NULL DEFAULT '',
  -- Signature / CTA
  salutation            varchar(100) NOT NULL DEFAULT '',
  cta_text              varchar(100) NOT NULL DEFAULT '',
  -- Bloc contact
  contact_block_title   varchar(255) NOT NULL DEFAULT 'Votre contact Derviche Diffusion',
  show_contact_block    boolean      NOT NULL DEFAULT true,
  -- Toggles
  show_reservation_code boolean      NOT NULL DEFAULT false,
  is_active             boolean      NOT NULL DEFAULT true,
  created_at            timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT email_templates_pkey PRIMARY KEY (id),
  CONSTRAINT email_templates_template_key_key UNIQUE (template_key)
);

COMMENT ON TABLE public.email_templates IS
  'Templates email éditables par les super-admins. '
  'La structure HTML est fixe dans le code ; les champs texte '
  'et les toggles sont éditables via l''interface admin.';

COMMENT ON COLUMN public.email_templates.header_title IS
  'Titre principal affiché dans l''en-tête coloré (ex: "Réservation confirmée ✓").';
COMMENT ON COLUMN public.email_templates.template_key IS
  'Identifiant technique unique du template (ex: reservation_confirmation).';
COMMENT ON COLUMN public.email_templates.subject IS
  'Objet du mail. Supporte les variables {{organisation}}, {{spectacle}}, etc.';
COMMENT ON COLUMN public.email_templates.intro_text IS
  'Texte d''introduction affiché avant le bloc récapitulatif. '
  'Supporte les variables {{prénom}}, {{spectacle}}, etc.';
COMMENT ON COLUMN public.email_templates.body_text IS
  'Texte additionnel affiché après le bloc récapitulatif. '
  'Supporte les variables {{prénom}}, {{spectacle}}, etc.';
COMMENT ON COLUMN public.email_templates.info_text IS
  'Texte du bloc informatif (📧). Si vide, le bloc n''est pas affiché.';
COMMENT ON COLUMN public.email_templates.salutation IS
  'Formule de politesse avant la signature (ex: "À très bientôt,"). '
  'Si vide, aucune formule n''est affichée.';
COMMENT ON COLUMN public.email_templates.cta_text IS
  'Texte du bouton CTA principal (ex: "Voir le spectacle →"). '
  'Si vide, le bouton n''est pas affiché.';
COMMENT ON COLUMN public.email_templates.contact_block_title IS
  'Titre du bloc contact Derviche affiché dans cet email.';
COMMENT ON COLUMN public.email_templates.show_contact_block IS
  'Afficher ou masquer le bloc contact Derviche dans cet email.';
COMMENT ON COLUMN public.email_templates.show_reservation_code IS
  'Afficher ou masquer le code de réservation (pertinent pour la confirmation uniquement).';

-- ============================================
-- 2. TRIGGER updated_at
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END;
$$;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. ACTIVATION RLS
-- ============================================

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Super-admin : lecture + écriture complète
CREATE POLICY "email_templates_all_super_admin"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Admin : lecture seule (pour afficher les templates dans l'UI)
CREATE POLICY "email_templates_select_admin"
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (public.has_role('admin'));

-- Utilisateurs authentifiés : lecture des templates actifs
-- (nécessaire pour les routes API email qui tournent avec la session user)
CREATE POLICY "email_templates_select_authenticated"
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================
-- 4. INSERTION DES TEMPLATES
-- ============================================

INSERT INTO public.email_templates (
  template_key,
  name,
  header_title,
  subject,
  intro_text,
  body_text,
  info_text,
  salutation,
  cta_text,
  contact_block_title,
  show_contact_block,
  show_reservation_code
)
VALUES
  -- ── Confirmation de réservation ────────────────────────────────────────────
  (
    'reservation_confirmation',
    'Confirmation de réservation',
    'Réservation confirmée ✓',
    'Votre réservation est confirmée — {{organisation}}',
    'Bonjour {{prénom}},' || chr(10) || chr(10) ||
    'Votre réservation pour {{spectacle}} a bien été enregistrée. Nous vous attendons avec plaisir !',
    '',
    'Conservez cet email — il vous servira de justificatif le jour de la représentation. Pensez à vérifier vos spams si vous ne l''avez pas reçu immédiatement.',
    'À très bientôt,',
    'Voir le spectacle →',
    'Votre contact Derviche Diffusion',
    true,
    true
  ),
  -- ── Annulation de réservation ──────────────────────────────────────────────
  (
    'reservation_cancellation',
    'Annulation de réservation',
    'Réservation annulée',
    'Annulation de votre réservation — {{organisation}}',
    'Bonjour {{prénom}},' || chr(10) || chr(10) ||
    'L''annulation de votre réservation pour {{spectacle}} a bien été prise en compte.',
    'Vous souhaitez découvrir d''autres spectacles ? Consultez notre catalogue en ligne.',
    '',
    'Cordialement,',
    'Voir le catalogue →',
    'Votre contact Derviche Diffusion',
    true,
    false
  ),
  -- ── Modification de créneau ────────────────────────────────────────────────
  (
    'reservation_modification',
    'Modification de créneau',
    'Créneau modifié ✓',
    'Modification de votre réservation — {{spectacle}}',
    'Bonjour {{prénom}},' || chr(10) || chr(10) ||
    'Votre réservation pour {{spectacle}} a bien été mise à jour avec le nouveau créneau ci-dessous.',
    '',
    'Conservez cet email — il vous servira de justificatif le jour de la représentation.',
    'À très bientôt,',
    'Voir le spectacle →',
    'Votre contact Derviche Diffusion',
    true,
    false
  ),
  -- ── Notification admin (email interne manager Derviche) ────────────────────
  -- header_title : préfixe affiché dans l'en-tête avant le type d'événement
  -- salutation   : vide — pas de formule de politesse dans les emails internes
  -- cta_text     : bouton vers l'interface admin
  -- show_contact_block / show_reservation_code : sans objet pour cet email interne
  (
    'admin_notification',
    'Notification admin (interne)',
    'Notification Admin',
    '[{{organisation}}] {{spectacle}}',
    '',
    '',
    '',
    '',
    'Voir dans l''admin →',
    '',
    false,
    false
  )
ON CONFLICT (template_key) DO NOTHING;

-- ============================================
-- 5. MIGRATION DES SUJETS DEPUIS app_settings
--    Ces clés sont désormais dans email_templates.subject.
--    On les supprime d'app_settings pour éviter la duplication.
-- ============================================

DELETE FROM public.app_settings
WHERE key IN (
  'email_confirmation_subject',
  'email_cancellation_subject'
);
