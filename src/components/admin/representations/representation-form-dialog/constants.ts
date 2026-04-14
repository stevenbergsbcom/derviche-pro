/**
 * Constantes pour RepresentationFormDialog
 * Derviche Diffusion - Session 103
 */

import type { RepresentationFormData, SlotHostedBy } from './types';
import type { UserRole } from '@/types/database';

// ============================================
// VALEURS PAR DÉFAUT
// ============================================

/**
 * Valeurs par défaut du formulaire
 * @note Le type de hostedBy est inféré depuis RepresentationFormData
 */
export const DEFAULT_FORM_DATA: RepresentationFormData = {
  date: '',
  time: '',
  venueId: '',
  capacity: null,
  hostedBy: 'derviche',
  hostedById: null,
};

/**
 * Capacité par défaut quand on désactive le mode illimité
 */
export const DEFAULT_CAPACITY = 20;

// ============================================
// VALEURS SPÉCIALES
// ============================================

/**
 * Valeur spéciale pour créer un nouveau lieu
 */
export const NEW_VENUE_VALUE = 'new';

/**
 * Valeur pour indiquer aucun membre disponible
 */
export const EMPTY_USER_VALUE = '_empty';

// ============================================
// MESSAGES
// ============================================

/**
 * Messages d'erreur
 */
export const ERROR_MESSAGES = {
  submissionFailed: 'Une erreur est survenue lors de la soumission',
} as const;

/**
 * Labels du formulaire
 */
export const LABELS = {
  // Titres
  createTitle: 'Ajouter une représentation',
  editTitle: 'Modifier la représentation',
  createDescription: 'Remplissez les informations pour créer une nouvelle représentation.',
  editDescription: 'Modifiez les informations de la représentation.',

  // Champs
  date: 'Date',
  time: 'Heure',
  venue: 'Lieu',
  capacity: 'Places max (pro)',
  capacityHelp: 'Nombre maximum de professionnel·le·s pouvant réserver',
  hostedBy: 'Accueil par',
  hostedById: 'Accueilli par',

  // Options
  derviche: 'Derviche Diffusion',
  company: 'Compagnie',
  unlimited: 'Illimité',

  // Placeholders
  selectVenue: 'Sélectionner un lieu',
  selectUser: 'Sélectionner un membre Derviche',
  createNewVenue: '➕ Créer un nouveau lieu...',
  noUserAvailable: 'Aucun membre disponible',

  // Boutons
  cancel: 'Annuler',
  create: 'Créer',
  edit: 'Modifier',
  creating: 'Création...',
  editing: 'Modification...',

  // Avertissements
  reservationsWarningTitle: 'Cette représentation a des réservations',
  reservationsWarningText:
    "La date et l'heure ne peuvent plus être modifiées. Vous pouvez toujours modifier le lieu, la capacité et l'accueil.",
} as const;

// ============================================
// OPTIONS
// ============================================

/**
 * Options pour le type d'accueil
 */
export const HOSTED_BY_OPTIONS: Array<{ value: SlotHostedBy; label: string }> = [
  { value: 'derviche', label: LABELS.derviche },
  { value: 'company', label: LABELS.company },
];

// ============================================
// RÔLES POUR L'AFFICHAGE
// ============================================

/**
 * Labels des rôles pour l'affichage dans le sélecteur
 * Couvre tous les UserRole pour robustesse
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  'super-admin': 'Super Admin',
  admin: 'Admin',
  externe: 'Externe',
  professional: 'Professionnel·le',
  company: 'Compagnie',
} as const;
