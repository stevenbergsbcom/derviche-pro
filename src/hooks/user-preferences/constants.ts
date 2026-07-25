/**
 * Constantes pour les preferences utilisateur
 * Derviche Diffusion
 */

import type {
  ReservationColumn,
  ReservationColumnsPreference,
  ProfessionalColumn,
  CompanyReservationColumn,
  CompanyReservationColumnsPreference,
} from './types';

// ============================================
// CONSTANTES ADMIN - COLONNES RESERVATIONS
// ============================================

/** Configuration des colonnes avec labels - Ordre logique */
export const RESERVATION_COLUMNS_CONFIG: Record<ReservationColumn, { label: string; defaultVisible: boolean }> = {
  // Infos reservation
  date: { label: 'Date', defaultVisible: true },
  spectacle: { label: 'Spectacle', defaultVisible: true },
  venue: { label: 'Lieu', defaultVisible: false },
  numPlaces: { label: 'Places', defaultVisible: true },
  status: { label: 'Statut', defaultVisible: true },
  checkinStatus: { label: 'Check-in', defaultVisible: true },

  // Infos personnelles
  lastName: { label: 'Nom', defaultVisible: true },
  firstName: { label: 'Prénom', defaultVisible: true },
  email: { label: 'Email', defaultVisible: true },
  phone: { label: 'Téléphone', defaultVisible: false },
  emailSecondary: { label: 'Email secondaire', defaultVisible: false },
  phoneSecondary: { label: 'Tél. secondaire', defaultVisible: false },

  // Infos professionnelles
  organization: { label: 'Structure', defaultVisible: false },
  function: { label: 'Fonction', defaultVisible: false },
  afcNumber: { label: 'N° AFC', defaultVisible: false },
  address: { label: 'Adresse', defaultVisible: false },
  // S175 — séparation adresse (utile pour l'analyse Excel / le pont CRM)
  addressStreet: { label: 'Rue', defaultVisible: false },
  addressPostalCode: { label: 'Code postal', defaultVisible: false },
  addressCity: { label: 'Ville', defaultVisible: false },
  addressCountry: { label: 'Pays', defaultVisible: false },

  // Notes et metadonnees
  specialRequests: { label: 'Demandes', defaultVisible: false },
  checkinNotes: { label: 'Notes accueil', defaultVisible: false },
  checkinVenueNotes: { label: 'Notes lieu', defaultVisible: false },
  checkinInternalNotes: { label: 'Notes internes', defaultVisible: false },
  // Emails merci post-accueil (type + date/heure d'envoi) — masquée par
  // défaut, activable pour le suivi/clean de base côté client.
  followupEmails: { label: 'Emails merci', defaultVisible: false },
  createdAt: { label: 'Créé le', defaultVisible: false },

  // S175 + Session B — Identifiants externes / techniques (masqués par défaut)
  crmIdPro: { label: 'ID CRM (pro)', defaultVisible: false },
  crmIdStructure: { label: 'ID CRM (structure)', defaultVisible: false },
  userUuid: { label: 'UUID pro (technique)', defaultVisible: false },
};

/** Ordre d'affichage par defaut des colonnes */
export const DEFAULT_COLUMNS_ORDER: ReservationColumn[] = [
  'date',
  'spectacle',
  'venue',
  'lastName',
  'firstName',
  'email',
  'phone',
  'emailSecondary',
  'phoneSecondary',
  'organization',
  'function',
  'afcNumber',
  'address',
  'addressStreet',
  'addressPostalCode',
  'addressCity',
  'addressCountry',
  'numPlaces',
  'status',
  'checkinStatus',
  'specialRequests',
  'checkinNotes',
  'checkinVenueNotes',
  'checkinInternalNotes',
  'followupEmails',
  'createdAt',
  // S175 + Session B — Colonnes CRM/techniques regroupées en fin de liste, masquées par défaut
  'crmIdPro',
  'crmIdStructure',
  'userUuid',
];

/** Colonnes visibles par defaut */
export const DEFAULT_VISIBLE_COLUMNS: ReservationColumn[] = Object.entries(RESERVATION_COLUMNS_CONFIG)
  .filter(([, config]) => config.defaultVisible)
  .map(([key]) => key as ReservationColumn);

/** Preferences par defaut */
export const DEFAULT_COLUMNS_PREFERENCE: ReservationColumnsPreference = {
  order: DEFAULT_COLUMNS_ORDER,
  visible: DEFAULT_VISIBLE_COLUMNS,
};

// ============================================
// CONSTANTES ADMIN - COLONNES PROFESSIONNELS
// ============================================

/** Configuration des colonnes professionnels */
export const PROFESSIONAL_COLUMNS_CONFIG: Record<ProfessionalColumn, { label: string; defaultVisible: boolean }> = {
  structure:    { label: 'Structure',          defaultVisible: true  },
  phone:        { label: 'Téléphone',          defaultVisible: true  },
  email2:       { label: 'Email secondaire',   defaultVisible: false },
  phone2:       { label: 'Tél. secondaire',    defaultVisible: false },
  function:     { label: 'Fonction',           defaultVisible: true  },
  city:         { label: 'Ville',              defaultVisible: true  },
  reservations: { label: 'Réservations',       defaultVisible: true  },
};

/** Ordre fixe des colonnes professionnels */
export const PROFESSIONAL_COLUMNS_ORDER: ProfessionalColumn[] = [
  'structure',
  'phone',
  'email2',
  'phone2',
  'function',
  'city',
  'reservations',
];

/** Colonnes visibles par defaut */
export const DEFAULT_PROFESSIONAL_VISIBLE_COLUMNS: ProfessionalColumn[] = Object.entries(
  PROFESSIONAL_COLUMNS_CONFIG
)
  .filter(([, config]) => config.defaultVisible)
  .map(([key]) => key as ProfessionalColumn);

// ============================================
// CONSTANTES COMPAGNIE - COLONNES RESERVATIONS
// ============================================

/** Configuration des colonnes compagnie avec labels.
 *  S198 : toutes les colonnes visibles par défaut — l'utilisateur décoche
 *  celles qu'il ne veut pas dans le dialog de sélection des colonnes.
 *  S175 : nouvelles colonnes IDs CRM masquées par défaut (cas d'usage rare
 *  côté compagnie, on n'encombre pas la vue par défaut). */
export const COMPANY_RESERVATION_COLUMNS_CONFIG: Record<CompanyReservationColumn, { label: string; defaultVisible: boolean }> = {
  // Infos reservation
  date: { label: 'Date', defaultVisible: true },
  spectacle: { label: 'Spectacle', defaultVisible: true },
  venue: { label: 'Lieu', defaultVisible: true },
  numPlaces: { label: 'Places', defaultVisible: true },
  status: { label: 'Statut', defaultVisible: true },
  checkinStatus: { label: 'Check-in', defaultVisible: true },

  // Infos personnelles
  lastName: { label: 'Nom', defaultVisible: true },
  firstName: { label: 'Prénom', defaultVisible: true },
  email: { label: 'Email', defaultVisible: true },
  phone: { label: 'Téléphone', defaultVisible: true },
  emailSecondary: { label: 'Email secondaire', defaultVisible: true },
  phoneSecondary: { label: 'Tél. secondaire', defaultVisible: true },

  // Infos professionnelles
  organization: { label: 'Structure', defaultVisible: true },
  function: { label: 'Fonction', defaultVisible: true },
  afcNumber: { label: 'N° AFC', defaultVisible: true },
  address: { label: 'Adresse', defaultVisible: true },
  // S175 — séparation adresse (export Excel)
  addressStreet: { label: 'Rue', defaultVisible: false },
  addressPostalCode: { label: 'Code postal', defaultVisible: false },
  addressCity: { label: 'Ville', defaultVisible: false },
  addressCountry: { label: 'Pays', defaultVisible: false },

  // Notes et metadonnees (SANS notes internes)
  specialRequests: { label: 'Demandes', defaultVisible: true },
  checkinNotes: { label: 'Notes accueil', defaultVisible: true },
  checkinVenueNotes: { label: 'Notes lieu', defaultVisible: true },
  createdAt: { label: 'Créé le', defaultVisible: true },

  // S175 — ID CRM Zoho du pro (masqué par défaut)
  crmIdPro: { label: 'ID CRM (pro)', defaultVisible: false },
};

/** Ordre d'affichage par defaut des colonnes compagnie */
export const DEFAULT_COMPANY_COLUMNS_ORDER: CompanyReservationColumn[] = [
  'date',
  'spectacle',
  'venue',
  'lastName',
  'firstName',
  'email',
  'phone',
  'emailSecondary',
  'phoneSecondary',
  'organization',
  'function',
  'afcNumber',
  'address',
  'addressStreet',
  'addressPostalCode',
  'addressCity',
  'addressCountry',
  'numPlaces',
  'status',
  'checkinStatus',
  'specialRequests',
  'checkinNotes',
  'checkinVenueNotes',
  'createdAt',
  // S175 — ID CRM pro
  'crmIdPro',
];

/** Colonnes visibles par defaut compagnie */
export const DEFAULT_COMPANY_VISIBLE_COLUMNS: CompanyReservationColumn[] = Object.entries(COMPANY_RESERVATION_COLUMNS_CONFIG)
  .filter(([, config]) => config.defaultVisible)
  .map(([key]) => key as CompanyReservationColumn);

/** Preferences par defaut compagnie */
export const DEFAULT_COMPANY_COLUMNS_PREFERENCE: CompanyReservationColumnsPreference = {
  order: DEFAULT_COMPANY_COLUMNS_ORDER,
  visible: DEFAULT_COMPANY_VISIBLE_COLUMNS,
};
