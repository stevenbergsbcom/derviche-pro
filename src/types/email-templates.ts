/**
 * Types — Email Templates
 * Derviche Diffusion
 *
 * Correspond à la table `email_templates` en base de données.
 * Les templates définissent le contenu textuel éditable des emails
 * transactionnels. La structure HTML reste fixe dans le code.
 */

// ============================================
// CLÉS DE TEMPLATES
// ============================================

/**
 * Identifiants techniques des templates email.
 * Correspond à la colonne `template_key` dans la table `email_templates`.
 */
export type EmailTemplateKey =
  | 'reservation_confirmation'
  | 'reservation_cancellation'
  | 'reservation_modification'
  | 'admin_notification'
  | 'reminder_7d'
  | 'reminder_2d'
  | 'reminder_4h'
  // Post-checkin (S144)
  | 'checkin_thank_you'
  | 'checkin_loved'
  | 'checkin_press'
  | 'checkin_followup_absent';

// ============================================
// INTERFACE PRINCIPALE
// ============================================

/** Ligne complète depuis la table `email_templates` */
export interface EmailTemplate {
  id: string;
  template_key: EmailTemplateKey;
  /** Nom lisible affiché dans l'UI admin */
  name: string;
  /**
   * Titre affiché dans l'en-tête coloré de l'email.
   * Ex: "Réservation confirmée ✓", "Notification Admin"
   */
  header_title: string;
  /** Objet du mail — supporte les variables {{organisation}}, {{spectacle}}, etc. */
  subject: string;
  /** Texte affiché avant le bloc récapitulatif */
  intro_text: string;
  /** Texte affiché après le bloc récapitulatif */
  body_text: string;
  /**
   * Texte du bloc informatif (📧).
   * Si vide, le bloc n'est pas rendu dans le HTML.
   */
  info_text: string;
  /**
   * Formule de politesse avant la signature.
   * Ex: "À très bientôt,", "Cordialement,"
   * Si vide, aucune formule n'est affichée.
   */
  salutation: string;
  /**
   * Texte du bouton CTA principal.
   * Ex: "Voir le spectacle →", "Voir dans l'admin →"
   * Si vide, le bouton n'est pas affiché.
   */
  cta_text: string;
  /** Titre du bloc contact Derviche pour ce template */
  contact_block_title: string;
  /** Afficher ou masquer le bloc contact Derviche */
  show_contact_block: boolean;
  /** Afficher ou masquer le code de réservation */
  show_reservation_code: boolean;
  /**
   * Style sobre (fond blanc, texte noir) vs style graphique (header bleu Derviche).
   * true = email sobre style personnel, false = design graphique standard.
   */
  is_simple_style: boolean;
  // ── Liens optionnels (post-checkin uniquement, S149) ──
  /** Afficher le lien vers le dossier de presse (si folder_url renseigné sur le spectacle) */
  show_folder_link: boolean;
  folder_link_text: string;
  /** Afficher le lien vers le teaser vidéo (si teaser_url renseigné sur le spectacle) */
  show_teaser_link: boolean;
  teaser_link_text: string;
  /** Afficher le lien vers la captation vidéo (si captation_url renseignée sur le spectacle) */
  show_captation_link: boolean;
  captation_link_text: string;
  /** Afficher un lien vers la page de réservation publique du spectacle */
  show_booking_link: boolean;
  booking_link_text: string;
  /** Afficher le lien vers le dossier photo (si photo_folder_url renseigné sur le spectacle) — S170 */
  show_photo_folder_link: boolean;
  photo_folder_link_text: string;
  /**
   * Si true + shows.derviche_site_url renseigné, le CTA principal pointe vers
   * la page dervichediffusion.com au lieu de la fiche publique interne.
   * Le libellé du bouton reste `cta_text` dans les deux cas (l'admin l'adapte
   * manuellement si besoin, ex. « Découvrir le spectacle »).
   */
  show_derviche_site_link: boolean;
  /** Template actif ou désactivé */
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// TYPES POUR ÉCRITURE (S134B — UI admin)
// ============================================

/** Champs modifiables via l'interface admin */
export type EmailTemplateUpdatePayload = Pick<
  EmailTemplate,
  | 'header_title'
  | 'subject'
  | 'intro_text'
  | 'body_text'
  | 'info_text'
  | 'salutation'
  | 'cta_text'
  | 'contact_block_title'
  | 'show_contact_block'
  | 'show_reservation_code'
  | 'is_simple_style'
  // Liens optionnels (S149)
  | 'show_folder_link'
  | 'folder_link_text'
  | 'show_teaser_link'
  | 'teaser_link_text'
  | 'show_captation_link'
  | 'captation_link_text'
  | 'show_booking_link'
  | 'booking_link_text'
  // Dossier photo (S170)
  | 'show_photo_folder_link'
  | 'photo_folder_link_text'
  // CTA externe dervichediffusion.com
  | 'show_derviche_site_link'
>;

// ============================================
// VARIABLES DE SUBSTITUTION
// ============================================

/**
 * Variables disponibles dans les champs texte éditables.
 * Utilisées pour l'affichage des badges dans l'UI admin (S134B).
 */
export const EMAIL_TEMPLATE_VARIABLES = [
  { key: '{{prénom}}',       description: 'Prénom du professionnel' },
  { key: '{{nom}}',          description: 'Nom complet du professionnel' },
  { key: '{{structure}}',    description: 'Structure / organisation du professionnel' },
  { key: '{{spectacle}}',    description: 'Titre du spectacle' },
  { key: '{{compagnie}}',    description: 'Nom de la compagnie' },
  { key: '{{date}}',         description: 'Date du créneau' },
  { key: '{{heure}}',        description: 'Heure du créneau' },
  { key: '{{lieu}}',         description: 'Nom du lieu' },
  { key: '{{ville}}',        description: 'Ville du lieu' },
  { key: '{{synopsis}}',     description: 'Synopsis court du spectacle' },
  { key: '{{durée}}',        description: 'Durée du spectacle (ex: 1h15)' },
  { key: '{{public_cible}}', description: 'Public(s) cible(s) du spectacle' },
  { key: '{{code}}',         description: 'Code de réservation' },
  { key: '{{organisation}}', description: 'Nom de l\'organisation' },
  /** Spécifique au template admin_notification : libellé de l'événement (ex: "Nouvelle réservation") */
  { key: '{{événement}}',    description: 'Type d\'événement (notification admin)' },
] as const;

export type EmailTemplateVariableKey =
  (typeof EMAIL_TEMPLATE_VARIABLES)[number]['key'];

// ============================================
// LABELS AFFICHÉS EN UI
// ============================================

export const EMAIL_TEMPLATE_NAMES: Record<EmailTemplateKey, string> = {
  reservation_confirmation:  'Confirmation de réservation',
  reservation_cancellation:  'Annulation de réservation',
  reservation_modification:  'Modification de créneau',
  admin_notification:        'Notification admin (interne)',
  reminder_7d:               'Rappel J-7 (7 jours avant)',
  reminder_2d:               'Rappel J-2 (2 jours avant)',
  reminder_4h:              'Rappel H-4 (4 heures avant)',
  // Post-checkin (S144)
  checkin_thank_you:         'Remerciement présence',
  checkin_loved:             'Coup de cœur ❤️',
  checkin_press:             'Suivi presse',
  checkin_followup_absent:   'Suivi absence',
};

// ============================================
// TYPES POST-CHECKIN (S144)
// ============================================

/** Clés de templates post-checkin uniquement */
export type CheckinFollowupTemplateKey =
  | 'checkin_thank_you'
  | 'checkin_loved'
  | 'checkin_press'
  | 'checkin_followup_absent';

/** Ligne de la table checkin_followup_emails */
export interface CheckinFollowupEmailRow {
  id: string;
  reservation_id: string;
  template_key: CheckinFollowupTemplateKey;
  sent_at: string;
  sent_by: string | null;
  created_at: string;
}
