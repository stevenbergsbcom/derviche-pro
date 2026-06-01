/**
 * Helpers et types pour les réservations admin
 * Derviche Diffusion
 */

import type { ReservationColumn } from '@/hooks/useUserPreferences';
import type { BookedBy } from '@/lib/services/admin-reservations';
import {
  formatDateShortWeekday as formatDateFr,
  formatDateTimeFr,
  formatLocalDate,
} from '@/lib/utils/format-date';

// ============================================
// TYPES
// ============================================

export type PeriodPreset = 'upcoming' | 'past' | 'all';
export type DatePreset = 'this_week' | 'this_month' | 'next_month' | 'custom';
export type SortOption = 'slot_date_asc' | 'slot_date_desc' | 'created_at_asc' | 'created_at_desc' | 'name_asc' | 'name_desc';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'slot_date_asc', label: 'Date représentation ↑' },
  { value: 'slot_date_desc', label: 'Date représentation ↓' },
  { value: 'created_at_desc', label: 'Date création ↓' },
  { value: 'created_at_asc', label: 'Date création ↑' },
  { value: 'name_asc', label: 'Nom A→Z' },
  { value: 'name_desc', label: 'Nom Z→A' },
];

/** Labels des colonnes pour le header du tableau */
export const COLUMN_HEADERS: Record<ReservationColumn, string> = {
  date: 'Date',
  spectacle: 'Spectacle',
  venue: 'Lieu',
  lastName: 'Nom',
  firstName: 'Prénom',
  email: 'Email',
  phone: 'Téléphone',
  emailSecondary: 'Email 2',
  phoneSecondary: 'Tél. 2',
  organization: 'Structure',
  function: 'Fonction',
  afcNumber: 'N° AFC',
  address: 'Adresse',
  // S175 — adresse éclatée
  addressStreet: 'Rue',
  addressPostalCode: 'CP',
  addressCity: 'Ville',
  addressCountry: 'Pays',
  numPlaces: 'Places',
  status: 'Statut',
  checkinStatus: 'Check-in',
  specialRequests: 'Demandes',
  checkinNotes: 'Notes check-in',
  checkinVenueNotes: 'Notes lieu',
  checkinInternalNotes: 'Notes internes',
  createdAt: 'Créé le',
  // S175 — Identifiants externes / techniques
  crmIdPro: 'ID CRM (pro)',
  crmIdVenue: 'ID CRM (lieu)',
  userUuid: 'UUID pro',
  venueUuid: 'UUID lieu',
};

// ============================================
// HELPERS DATE
// ============================================

// formatLocalDate importé depuis @/lib/utils/format-date
export { formatLocalDate };

export function getDatePresetRange(preset: DatePreset): { dateFrom?: string; dateTo?: string } {
  const today = new Date();
  
  switch (preset) {
    case 'this_week': {
      // Lundi de cette semaine à dimanche
      const monday = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lundi = 1, Dimanche = 0
      monday.setDate(today.getDate() + diff);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      return {
        dateFrom: formatLocalDate(monday),
        dateTo: formatLocalDate(sunday),
      };
    }
    case 'this_month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        dateFrom: formatLocalDate(firstDay),
        dateTo: formatLocalDate(lastDay),
      };
    }
    case 'next_month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return {
        dateFrom: formatLocalDate(firstDay),
        dateTo: formatLocalDate(lastDay),
      };
    }
    default:
      return {};
  }
}

// formatDateFr (= formatDateShortWeekday) et formatDateTimeFr importés depuis @/lib/utils/format-date
export { formatDateFr, formatDateTimeFr };

// ============================================
// HELPERS TRI COLONNES
// ============================================

/** Colonnes qui peuvent être triées et leur mapping vers les options de tri */
type SortableColumn = 'date' | 'lastName' | 'createdAt';

export const SORTABLE_COLUMNS: Record<SortableColumn, { asc: SortOption; desc: SortOption }> = {
  date: { asc: 'slot_date_asc', desc: 'slot_date_desc' },
  lastName: { asc: 'name_asc', desc: 'name_desc' },
  createdAt: { asc: 'created_at_asc', desc: 'created_at_desc' },
};

/** Vérifie si une colonne est triable */
export function isSortableColumn(col: ReservationColumn): col is SortableColumn {
  return col in SORTABLE_COLUMNS;
}

/** Obtient l'état de tri actuel pour une colonne */
export function getColumnSortState(col: SortableColumn, currentSort: SortOption | undefined): 'asc' | 'desc' | null {
  if (!currentSort) return null;
  const mapping = SORTABLE_COLUMNS[col];
  if (currentSort === mapping.asc) return 'asc';
  if (currentSort === mapping.desc) return 'desc';
  return null;
}

// ============================================
// HELPER — LIBELLÉ « QUI A SAISI » (bookedBy)
// ============================================

/**
 * Construit le libellé affiché en italique sous le nom du client dans la
 * liste des réservations — cf. discussion session 200 (traçabilité 4 cas).
 *
 * Exemples de rendu :
 *  - « Réservée en ligne (invité) »
 *  - « Réservée en ligne par J. Dupont »
 *  - « Saisie par la compagnie A Kan la dériv' »
 *  - « Saisie par S. Berg (admin) »
 *
 * Si `firstName` est absent, on tombe sur « [LastName] » seul. Si les deux
 * sont absents, on renvoie « un utilisateur inconnu » pour ne pas laisser
 * un espace vide gênant dans l'UI.
 */
export function formatBookedByLabel(bookedBy: BookedBy): string {
  switch (bookedBy.kind) {
    case 'anonymous':
      return 'Réservée en ligne (invité)';
    case 'pro': {
      const name = formatShortName(bookedBy.firstName, bookedBy.lastName);
      return `Réservée en ligne par ${name}`;
    }
    case 'company':
      return `Saisie par la compagnie ${bookedBy.name}`;
    case 'admin': {
      const name = formatShortName(bookedBy.firstName, bookedBy.lastName);
      return `Saisie par ${name} (${bookedBy.role})`;
    }
    default: {
      // Exhaustiveness check — si un nouveau kind est ajouté au type
      // `BookedBy`, TypeScript forcera l'ajout d'un case ici.
      const _exhaustive: never = bookedBy;
      return String(_exhaustive);
    }
  }
}

/** `Jean Dupont` → `J. Dupont`. Fallback gracieux si l'un des deux manque. */
function formatShortName(firstName: string | null, lastName: string | null): string {
  const f = firstName?.trim();
  const l = lastName?.trim();
  if (f && l) return `${f.charAt(0).toUpperCase()}. ${l}`;
  if (l) return l;
  if (f) return f;
  return 'un utilisateur inconnu';
}
