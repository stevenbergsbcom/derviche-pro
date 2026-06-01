/**
 * Constantes colonnes pour les réservations compagnie
 * Derviche Diffusion
 */

import type { CompanyExportColumn } from '@/lib/services/company-reservations';

// ============================================
// COLONNES COMPAGNIE (sans notes internes)
// ============================================

/** Configuration des colonnes pour les compagnies */
export const COMPANY_COLUMNS_CONFIG: Record<
  CompanyExportColumn,
  { label: string; defaultVisible: boolean }
> = {
  date: { label: 'Date', defaultVisible: true },
  spectacle: { label: 'Spectacle', defaultVisible: true },
  venue: { label: 'Lieu', defaultVisible: false },
  lastName: { label: 'Nom', defaultVisible: true },
  firstName: { label: 'Prénom', defaultVisible: true },
  email: { label: 'Email', defaultVisible: true },
  phone: { label: 'Téléphone', defaultVisible: false },
  emailSecondary: { label: 'Email secondaire', defaultVisible: false },
  phoneSecondary: { label: 'Tél. secondaire', defaultVisible: false },
  organization: { label: 'Structure', defaultVisible: false },
  function: { label: 'Fonction', defaultVisible: false },
  afcNumber: { label: 'N° AFC', defaultVisible: false },
  address: { label: 'Adresse', defaultVisible: false },
  // S175 — adresse éclatée
  addressStreet: { label: 'Rue', defaultVisible: false },
  addressPostalCode: { label: 'Code postal', defaultVisible: false },
  addressCity: { label: 'Ville', defaultVisible: false },
  numPlaces: { label: 'Places', defaultVisible: true },
  status: { label: 'Statut', defaultVisible: true },
  checkinStatus: { label: 'Check-in', defaultVisible: true },
  specialRequests: { label: 'Demandes', defaultVisible: false },
  checkinNotes: { label: 'Notes check-in', defaultVisible: false },
  checkinVenueNotes: { label: 'Notes lieu', defaultVisible: false },
  createdAt: { label: 'Créé le', defaultVisible: false },
  // S175 — IDs CRM Zoho (masqués par défaut)
  crmIdPro: { label: 'ID CRM (pro)', defaultVisible: false },
  crmIdVenue: { label: 'ID CRM (lieu)', defaultVisible: false },
};

/** Ordre d'affichage par défaut des colonnes compagnie */
export const COMPANY_COLUMNS_ORDER: CompanyExportColumn[] = [
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
  'numPlaces',
  'status',
  'checkinStatus',
  'specialRequests',
  'checkinNotes',
  'checkinVenueNotes',
  'createdAt',
  // S175 — IDs CRM
  'crmIdPro',
  'crmIdVenue',
];

/** Colonnes visibles par défaut pour les compagnies */
export const COMPANY_DEFAULT_VISIBLE_COLUMNS: CompanyExportColumn[] = Object.entries(
  COMPANY_COLUMNS_CONFIG
)
  .filter(([, config]) => config.defaultVisible)
  .map(([key]) => key as CompanyExportColumn);
