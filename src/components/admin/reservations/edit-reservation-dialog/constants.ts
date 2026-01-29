/**
 * Constantes pour EditReservationDialog
 * Derviche Diffusion - Session 111
 */

// ============================================
// LIMITES ET SEUILS
// ============================================

/**
 * Seuil de capacité illimitée (convention BDD)
 */
export const UNLIMITED_CAPACITY = 999999;

/**
 * Nombre minimum de places
 */
export const MIN_PLACES = 1;

/**
 * Nombre maximum de places
 */
export const MAX_PLACES = 10;

// ============================================
// LABELS
// ============================================

/**
 * Labels des champs du formulaire
 */
export const LABELS = {
  // Section Créneau/Places
  sectionSlotPlaces: 'Créneau et places',
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
  
  // Section Notes
  sectionNotes: 'Notes',
  specialRequests: 'Demandes spéciales',
  checkinComment: 'Notes check-in',
  checkinVenueNotes: 'Notes lieu',
  checkinInternalNotes: 'Notes internes',
} as const;

// ============================================
// MESSAGES
// ============================================

/**
 * Messages d'erreur de validation
 */
export const VALIDATION_MESSAGES = {
  formNotInitialized: 'Formulaire non initialisé',
  firstNameRequired: 'Le prénom est requis',
  lastNameRequired: 'Le nom est requis',
  emailRequired: "L'email est requis",
  emailInvalid: "L'email n'est pas valide",
  numPlacesMin: 'Le nombre de places doit être au moins 1',
  slotRequired: 'Un créneau doit être sélectionné',
} as const;

/**
 * Messages d'information
 */
export const INFO_MESSAGES = {
  slotCapacityInfo: 'La modification du créneau ou du nombre de places met à jour automatiquement les capacités disponibles.',
  loadingSlots: 'Chargement...',
  loadingForm: 'Chargement...',
  slotsLoadError: 'Erreur lors du chargement des créneaux',
} as const;

/**
 * Messages pour les alertes
 */
export const ALERT_MESSAGES = {
  cancelled: {
    title: 'Réservation annulée',
    prefix: 'Annulée le',
    reasonPrefix: 'Motif :',
  },
  anomaly: {
    title: 'Anomalie de données détectée',
    description: 'Certains champs requis sont vides dans la base de données. Veuillez les compléter avant d\'enregistrer.',
  },
  validation: {
    title: 'Erreurs de validation',
  },
} as const;

/**
 * Labels des boutons
 */
export const BUTTON_LABELS = {
  save: 'Enregistrer',
  close: 'Fermer',
  cancelReservation: 'Annuler la réservation',
} as const;

/**
 * Placeholders
 */
export const PLACEHOLDERS = {
  selectSlot: 'Sélectionner un créneau',
  slotAvailable: (available: string | number) => `(${available} dispo)`,
  slotUnknownVenue: 'Lieu ?',
} as const;
