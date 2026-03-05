/**
 * Constantes - WalkInDrawer
 * Derviche Diffusion
 */

import type { WalkInFormData } from './types';
import type { NotificationOptions } from '@/components/admin/reservations/notification-switches';

// ============================================
// VALEURS INITIALES
// ============================================

export const INITIAL_FORM_DATA: WalkInFormData = {
  showId: '',
  slotId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  emailSecondary: '',
  phoneSecondary: '',
  organization: '',
  function: '',
  afcNumber: '',
  address: '',
  postalCode: '',
  city: '',
  numPlaces: 1,
  specialRequests: '',
  checkinVenueNotes: '',
  checkinInternalNotes: '',
  checkinStatus: null,
  sendEmail: false,
  syncCalendar: false,
  overrideCapacity: false,
};

export const DEFAULT_NOTIF_OPTIONS: NotificationOptions = {
  sendEmail: false,
  syncCalendar: false,
};

// ============================================
// MESSAGES
// ============================================

export const TOAST_MESSAGES = {
  searchError: 'Erreur lors de la recherche',
  createSuccess: 'Réservation créée avec succès',
  createError: 'Erreur lors de la création',
  loadShowsError: 'Impossible de charger les spectacles',
  loadSlotsError: 'Impossible de charger les créneaux',
  validationMissingSlot: 'Veuillez sélectionner un créneau',
  validationMissingName: 'Le prénom et le nom sont obligatoires',
  validationMissingEmail: 'L\'email est obligatoire',
  validationInvalidEmail: 'Email invalide',
} as const;

// ============================================
// LABELS DES ÉTAPES
// ============================================

export const STEP_LABELS: Record<string, string> = {
  'email-search': 'Recherche du professionnel',
  'form': 'Informations de réservation',
};

// ============================================
// LABELS CHECK-IN STATUS (pour le select du formulaire)
// ============================================

export const CHECKIN_STATUS_OPTIONS = [
  { value: 'present_neutral', label: '✓ Présent' },
  { value: 'present_loved', label: '❤️ Coup de cœur' },
  { value: 'present_press', label: '📰 Presse' },
  { value: 'absent', label: '✗ Absent' },
] as const;
