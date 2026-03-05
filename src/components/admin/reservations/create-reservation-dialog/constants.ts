/**
 * Constantes pour CreateReservationDialog
 * Derviche Diffusion - Session 104
 */

import type { CreateAdminReservationData } from '@/lib/services/admin-reservations';

// ============================================
// VALEURS PAR DÉFAUT
// ============================================

/**
 * État initial du formulaire de création
 */
export const INITIAL_FORM_DATA: CreateAdminReservationData = {
  slotId: '',
  numPlaces: 1,
  firstName: '',
  lastName: '',
  email: '',
  phone: null,
  emailSecondary: null,
  phoneSecondary: null,
  address: null,
  postalCode: null,
  city: null,
  country: null,
  organization: null,
  function: null,
  afcNumber: null,
  comment: null,
  checkinComment: null,
  checkinVenueNotes: null,
  checkinInternalNotes: null,
};

/**
 * Limite de places par défaut (si non spécifié par le spectacle)
 */
export const DEFAULT_MAX_PLACES = 10;

/**
 * Seuil de capacité illimitée (convention BDD)
 */
export const UNLIMITED_CAPACITY = 999999;

// ============================================
// MESSAGES
// ============================================

/**
 * Messages d'erreur de validation
 */
export const VALIDATION_MESSAGES = {
  showRequired: 'Veuillez sélectionner un spectacle',
  slotRequired: 'Veuillez sélectionner un créneau',
  firstNameRequired: 'Le prénom est requis',
  lastNameRequired: 'Le nom est requis',
  emailRequired: "L'email est requis",
  emailInvalid: "L'email n'est pas valide",
  numPlacesMin: 'Le nombre de places doit être au moins 1',
  numPlacesMax: (max: number) => `Le nombre de places ne peut pas dépasser ${max}`,
  capacityInsufficient: (available: number) => `Capacité insuffisante (${available} places disponibles)`,
} as const;

/**
 * Messages toast
 */
export const TOAST_MESSAGES = {
  validationError: 'Veuillez corriger les erreurs',
  createSuccess: 'Réservation créée avec succès',
  createError: 'Erreur lors de la création',
} as const;

/**
 * Placeholders des champs
 */
export const PLACEHOLDERS = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont@example.com',
  phone: '06 12 34 56 78',
  organization: 'Théâtre Municipal',
  function: 'Directeur artistique',
  afcNumber: 'AFC-12345',
  address: '123 rue du Théâtre',
  postalCode: '75001',
  city: 'Paris',
  country: 'France',
  comment: 'Besoins particuliers, accessibilité...',
  checkinComment: 'Notes visibles lors du check-in...',
  checkinVenueNotes: 'Informations spécifiques au lieu...',
  checkinInternalNotes: 'Notes confidentielles pour l\'équipe...',
} as const;

// ============================================
// LABELS
// ============================================

/**
 * Labels des champs du formulaire
 */
export const LABELS = {
  // Section Spectacle/Créneau
  sectionShowSlot: 'Spectacle et créneau',
  show: 'Spectacle',
  slot: 'Créneau',
  numPlaces: 'Nombre de places',
  
  // Section Informations personnelles
  sectionPersonal: 'Informations personnelles',
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'Email',
  phone: 'Téléphone',
  emailSecondary: 'Email secondaire',
  phoneSecondary: 'Tél. secondaire',
  
  // Section Professionnel
  sectionProfessional: 'Informations professionnelles',
  organization: 'Structure / Organisation',
  function: 'Fonction',
  afcNumber: 'Numéro AFC',
  
  // Section Adresse
  sectionAddress: 'Adresse',
  address: 'Adresse',
  postalCode: 'Code postal',
  city: 'Ville',
  country: 'Pays',
  
  // Section Notes
  sectionNotes: 'Notes',
  comment: 'Demandes spéciales',
  checkinComment: 'Notes check-in',
  checkinVenueNotes: 'Notes lieu',
  checkinInternalNotes: 'Notes internes',
} as const;
