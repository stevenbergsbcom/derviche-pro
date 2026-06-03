/**
 * Constantes pour useAdminReservations
 * @module hooks/admin-reservations/constants
 */

import type { ReservationColumn } from '@/hooks/useUserPreferences';

/**
 * Labels des colonnes pour l'export
 * Mapping colonne technique → label français lisible
 */
export const EXPORT_COLUMN_LABELS: Record<ReservationColumn, string> = {
  date: 'Date représentation',
  spectacle: 'Spectacle',
  venue: 'Lieu',
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'Email',
  phone: 'Téléphone',
  emailSecondary: 'Email secondaire',
  phoneSecondary: 'Tél. secondaire',
  organization: 'Structure',
  function: 'Fonction',
  afcNumber: 'N° AFC',
  address: 'Adresse complète',
  // S175 — adresse séparée (export)
  addressStreet: 'Rue',
  addressPostalCode: 'Code postal',
  addressCity: 'Ville',
  addressCountry: 'Pays',
  numPlaces: 'Nb places',
  status: 'Statut',
  checkinStatus: 'Check-in',
  specialRequests: 'Demandes spéciales',
  checkinNotes: 'Notes check-in',
  checkinVenueNotes: 'Notes lieu',
  checkinInternalNotes: 'Notes internes',
  createdAt: 'Créé le',
  // S175 + Session B — identifiants externes
  crmIdPro: 'ID CRM Zoho (pro)',
  crmIdStructure: 'ID CRM Zoho (structure)',
  userUuid: 'UUID pro (technique)',
} as const;

/**
 * Colonnes par défaut pour l'export legacy (CSV simple)
 */
export const LEGACY_EXPORT_COLUMNS: ReservationColumn[] = [
  'date',
  'spectacle',
  'venue',
  'lastName',
  'firstName',
  'email',
  'phone',
  'organization',
  'function',
  'numPlaces',
  'status',
  'checkinStatus',
  'createdAt',
] as const;

/**
 * Labels des statuts de check-in pour les toasts
 */
export const CHECKIN_STATUS_LABELS: Record<string, string> = {
  present_loved: '❤️ Présent - A aimé',
  present_press: '📰 Présent - Presse',
  present_neutral: '😐 Présent - Neutre',
  absent: '❌ Absent',
} as const;

/**
 * Taille de page par défaut
 */
export const DEFAULT_PAGE_SIZE = 20;
