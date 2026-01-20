/**
 * Helpers et types pour les réservations admin
 * Derviche Diffusion
 */

import type { ReservationColumn } from '@/hooks/useUserPreferences';

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
  numPlaces: 'Places',
  status: 'Statut',
  checkinStatus: 'Check-in',
  specialRequests: 'Demandes',
  checkinNotes: 'Notes check-in',
  checkinVenueNotes: 'Notes lieu',
  checkinInternalNotes: 'Notes internes',
  createdAt: 'Créé le',
};

// ============================================
// HELPERS DATE
// ============================================

/**
 * Formate une date en YYYY-MM-DD en utilisant la timezone locale
 * Évite le problème de décalage UTC avec toISOString()
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

export function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateTimeFr(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
