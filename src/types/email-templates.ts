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
  | 'reminder_12h';

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
  { key: '{{nom}}',          description: 'Nom du professionnel' },
  { key: '{{spectacle}}',    description: 'Titre du spectacle' },
  { key: '{{date}}',         description: 'Date du créneau' },
  { key: '{{heure}}',        description: 'Heure du créneau' },
  { key: '{{lieu}}',         description: 'Nom du lieu' },
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
  reservation_confirmation: 'Confirmation de réservation',
  reservation_cancellation: 'Annulation de réservation',
  reservation_modification: 'Modification de créneau',
  admin_notification:       'Notification admin (interne)',
  reminder_7d:              'Rappel J-7 (7 jours avant)',
  reminder_2d:              'Rappel J-2 (2 jours avant)',
  reminder_12h:             'Rappel H-12 (12 heures avant)',
};
