/**
 * Hook useCompanyReservations - Gestion des réservations côté compagnie
 * Derviche Diffusion
 * 
 * Fonctionnalités (lecture seule) :
 * - Liste paginée avec filtres
 * - Export CSV et Excel (colonnes restreintes)
 * - Statistiques
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  getCompanyReservations,
  getAllCompanyReservationsForExport,
  getCompanyReservationStats,
  getCompanyShows,
  type CompanyReservation,
  type CompanyReservationFilters,
  type PaginationOptions,
  type CompanyReservationStats,
  type CompanyExportColumn,
} from '@/lib/services/company-reservations';

// Re-export du type pour usage externe
export type { CompanyExportColumn } from '@/lib/services/company-reservations';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export type ExportFormat = 'csv' | 'xlsx';
export type ExportPeriod = 'all' | 'upcoming' | 'past';

export interface CompanyExportOptions {
  format: ExportFormat;
  columns: CompanyExportColumn[];
  period: ExportPeriod;
}

export interface UseCompanyReservationsReturn {
  /** Liste des réservations */
  reservations: CompanyReservation[];
  /** Nombre total de réservations (pour pagination) */
  total: number;
  /** Page actuelle */
  page: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Nombre d'éléments par page */
  pageSize: number;
  /** Chargement en cours */
  isLoading: boolean;
  /** Message d'erreur */
  error: string | null;
  /** Statistiques des réservations */
  stats: CompanyReservationStats | null;
  /** Filtres actifs */
  filters: CompanyReservationFilters;
  /** Spectacles de la compagnie (pour filtre) */
  shows: Array<{ id: string; title: string; slug: string }>;

  /** Charger les réservations avec filtres et pagination */
  loadReservations: (
    filters?: CompanyReservationFilters,
    pagination?: PaginationOptions
  ) => Promise<{ success: boolean; error?: string }>;

  /** Charger les statistiques */
  loadStats: (filters?: { showId?: string }) => Promise<{ success: boolean; error?: string }>;

  /** Charger les spectacles de la compagnie */
  loadShows: () => Promise<{ success: boolean; error?: string }>;

  /** Exporter avec options (format et colonnes) */
  exportWithOptions: (options: CompanyExportOptions) => Promise<{ success: boolean; error?: string }>;

  /** Changer de page */
  setPage: (page: number) => void;

  /** Changer le nombre d'éléments par page */
  setPageSize: (size: number) => void;

  /** Mettre à jour les filtres */
  setFilters: (filters: CompanyReservationFilters) => void;

  /** Réinitialiser les filtres */
  resetFilters: () => void;
}

// ============================================
// COLONNES COMPAGNIE (sans notes internes)
// ============================================

/** Configuration des colonnes pour les compagnies */
export const COMPANY_COLUMNS_CONFIG: Record<CompanyExportColumn, { label: string; defaultVisible: boolean }> = {
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
  numPlaces: { label: 'Places', defaultVisible: true },
  status: { label: 'Statut', defaultVisible: true },
  checkinStatus: { label: 'Check-in', defaultVisible: true },
  specialRequests: { label: 'Demandes', defaultVisible: false },
  checkinNotes: { label: 'Notes check-in', defaultVisible: false },
  checkinVenueNotes: { label: 'Notes lieu', defaultVisible: false },
  createdAt: { label: 'Créé le', defaultVisible: false },
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
  'numPlaces',
  'status',
  'checkinStatus',
  'specialRequests',
  'checkinNotes',
  'checkinVenueNotes',
  'createdAt',
];

/** Colonnes visibles par défaut pour les compagnies */
export const COMPANY_DEFAULT_VISIBLE_COLUMNS: CompanyExportColumn[] = Object.entries(COMPANY_COLUMNS_CONFIG)
  .filter(([, config]) => config.defaultVisible)
  .map(([key]) => key as CompanyExportColumn);

// ============================================
// HELPERS EXPORT
// ============================================

/** Labels des colonnes pour l'export */
const EXPORT_COLUMN_LABELS: Record<CompanyExportColumn, string> = {
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
  numPlaces: 'Nb places',
  status: 'Statut',
  checkinStatus: 'Check-in',
  specialRequests: 'Demandes spéciales',
  checkinNotes: 'Notes check-in',
  checkinVenueNotes: 'Notes lieu',
  createdAt: 'Créé le',
};

/** Traduit le statut réservation */
function translateStatus(status: string): string {
  const map: Record<string, string> = {
    confirmed: 'Confirmée',
    cancelled: 'Annulée',
    no_show: 'No-show',
  };
  return map[status] || status;
}

/** Traduit le statut check-in */
function translateCheckin(status: string | null): string {
  if (!status) return '-';
  const map: Record<string, string> = {
    present_loved: 'A aimé',
    present_press: 'Presse',
    present_neutral: 'Neutre',
    absent: 'Absent',
  };
  return map[status] || status;
}

/** Formate une date courte pour l'export */
function formatDateExport(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Obtient la valeur d'une colonne pour l'export */
function getCellValue(col: CompanyExportColumn, r: CompanyReservation): string {
  switch (col) {
    case 'date':
      return r.slot?.date ? formatDateExport(r.slot.date) : '-';
    case 'spectacle':
      return r.slot?.show?.title || '-';
    case 'venue':
      return r.slot?.venue?.name || '-';
    case 'firstName':
      return r.firstName || '-';
    case 'lastName':
      return r.lastName || '-';
    case 'email':
      return r.email || '-';
    case 'phone':
      return r.phone || '-';
    case 'emailSecondary':
      return r.emailSecondary || '-';
    case 'phoneSecondary':
      return r.phoneSecondary || '-';
    case 'organization':
      return r.organization || '-';
    case 'function':
      return r.function || '-';
    case 'afcNumber':
      return r.afcNumber || '-';
    case 'address': {
      const parts = [r.address, r.postalCode, r.city].filter(Boolean);
      return parts.length > 0 ? parts.join(' ') : '-';
    }
    case 'numPlaces':
      return String(r.numPlaces);
    case 'status':
      return translateStatus(r.status);
    case 'checkinStatus':
      return translateCheckin(r.checkinStatus);
    case 'specialRequests':
      return r.specialRequests || '-';
    case 'checkinNotes':
      return r.checkinNotes || '-';
    case 'checkinVenueNotes':
      return r.checkinVenueNotes || '-';
    case 'createdAt':
      return r.createdAt ? formatDateExport(r.createdAt.split('T')[0]) : '-';
    default:
      return '-';
  }
}

/** Génère un nom de fichier intelligent basé sur les filtres */
export function generateCompanyExportFilename(
  filters: CompanyReservationFilters,
  format: ExportFormat,
  period: ExportPeriod,
  showTitle?: string
): string {
  const date = new Date().toISOString().split('T')[0];
  const parts: string[] = ['reservations'];

  if (showTitle) {
    const cleanTitle = showTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);
    parts.push(cleanTitle);
  }

  if (period === 'upcoming') {
    parts.push('a-venir');
  } else if (period === 'past') {
    parts.push('passees');
  } else {
    parts.push('toutes');
  }

  if (filters.status) {
    parts.push(filters.status);
  }

  parts.push(date);

  return `${parts.join('_')}.${format}`;
}

/**
 * Convertit les réservations en CSV avec colonnes personnalisées
 */
function reservationsToCSV(
  reservations: CompanyReservation[],
  columns: CompanyExportColumn[]
): string {
  const headers = columns.map((col) => EXPORT_COLUMN_LABELS[col]);

  const escapeCSV = (value: string): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(';') || str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = reservations.map((r) =>
    columns.map((col) => escapeCSV(getCellValue(col, r)))
  );

  const BOM = '\uFEFF';
  return BOM + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
}

/**
 * Convertit les réservations en Excel avec colonnes personnalisées
 */
function reservationsToExcel(
  reservations: CompanyReservation[],
  columns: CompanyExportColumn[]
): Uint8Array {
  const headers = columns.map((col) => EXPORT_COLUMN_LABELS[col]);
  const data = reservations.map((r) =>
    columns.map((col) => getCellValue(col, r))
  );

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  const colWidths = columns.map((col, index) => {
    const headerLen = EXPORT_COLUMN_LABELS[col].length;
    const maxDataLen = Math.max(
      ...data.map((row) => {
        const cellValue = row[index];
        return cellValue ? String(cellValue).length : 0;
      }),
      0
    );
    return { wch: Math.min(Math.max(headerLen, maxDataLen) + 2, 50) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Réservations');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

/**
 * Télécharge un fichier CSV
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Télécharge un fichier Excel
 */
function downloadExcel(content: Uint8Array, filename: string): void {
  const blob = new Blob([Uint8Array.from(content) as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// HOOK
// ============================================

export function useCompanyReservations(
  initialPageSize: number = 20
): UseCompanyReservationsReturn {
  const [reservations, setReservations] = useState<CompanyReservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CompanyReservationStats | null>(null);
  const [filters, setFiltersState] = useState<CompanyReservationFilters>({});
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [shows, setShows] = useState<Array<{ id: string; title: string; slug: string }>>([]);

  // Ref pour éviter les race conditions
  const loadingRef = useRef<string | null>(null);

  // ============================================
  // LOAD RESERVATIONS
  // ============================================
  const loadReservations = useCallback(
    async (
      newFilters?: CompanyReservationFilters,
      pagination?: PaginationOptions
    ): Promise<{ success: boolean; error?: string }> => {
      const requestId = Date.now().toString();
      loadingRef.current = requestId;

      const activeFilters = newFilters ?? filters;
      const activePagination = pagination ?? { page, pageSize };

      setIsLoading(true);
      setError(null);

      const result = await getCompanyReservations(activeFilters, activePagination);

      // Vérifier que la requête est toujours d'actualité
      if (loadingRef.current !== requestId) {
        return { success: false, error: 'Requête annulée' };
      }

      setIsLoading(false);
      loadingRef.current = null;

      if (result.error) {
        setError(result.error);
        logger.error('[useCompanyReservations] Erreur chargement', { error: result.error });
        toast.error('Erreur lors du chargement des réservations');
        return { success: false, error: result.error };
      }

      setReservations(result.data);
      setTotal(result.total);
      setPageState(result.page);
      setTotalPages(result.totalPages);

      if (newFilters) {
        setFiltersState(newFilters);
      }

      return { success: true };
    },
    [filters, page, pageSize]
  );

  // ============================================
  // LOAD STATS
  // ============================================
  const loadStats = useCallback(
    async (
      statFilters?: { showId?: string }
    ): Promise<{ success: boolean; error?: string }> => {
      const result = await getCompanyReservationStats(statFilters || {});

      if (result.error || !result.data) {
        logger.error('[useCompanyReservations] Erreur chargement stats', { error: result.error });
        return { success: false, error: result.error || 'Erreur lors du chargement' };
      }

      setStats(result.data);
      return { success: true };
    },
    []
  );

  // ============================================
  // LOAD SHOWS
  // ============================================
  const loadShows = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    const result = await getCompanyShows();

    if (result.error) {
      logger.error('[useCompanyReservations] Erreur chargement spectacles', { error: result.error });
      return { success: false, error: result.error };
    }

    setShows(result.data);
    return { success: true };
  }, []);

  // ============================================
  // EXPORT AVEC OPTIONS
  // ============================================
  const exportWithOptions = useCallback(
    async (options: CompanyExportOptions): Promise<{ success: boolean; error?: string }> => {
      const { format, columns, period } = options;

      if (columns.length === 0) {
        toast.error('Veuillez sélectionner au moins une colonne');
        return { success: false, error: 'Aucune colonne sélectionnée' };
      }

      toast.info('Préparation de l\'export...');

      // Combiner les filtres avec la période choisie
      const exportFilters: CompanyReservationFilters = {
        ...filters,
        period: period === 'all' ? undefined : period,
      };

      const result = await getAllCompanyReservationsForExport(exportFilters);

      if (result.error) {
        logger.error('[useCompanyReservations] Erreur export', { error: result.error });
        toast.error("Erreur lors de l'export");
        return { success: false, error: result.error };
      }

      if (result.data.length === 0) {
        toast.warning('Aucune réservation à exporter');
        return { success: false, error: 'Aucune donnée' };
      }

      // Générer le nom du fichier
      const showTitle = filters.showId && result.data.length > 0
        ? result.data[0]?.slot?.show?.title
        : undefined;
      const filename = generateCompanyExportFilename(exportFilters, format, period, showTitle);

      try {
        if (format === 'xlsx') {
          const excelData = reservationsToExcel(result.data, columns);
          downloadExcel(excelData, filename);
        } else {
          const csv = reservationsToCSV(result.data, columns);
          downloadCSV(csv, filename);
        }

        toast.success(
          `${result.data.length} réservation${result.data.length > 1 ? 's' : ''} exportée${result.data.length > 1 ? 's' : ''} (${format.toUpperCase()})`
        );
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('[useCompanyReservations] Erreur génération fichier', { message });
        toast.error('Erreur lors de la génération du fichier');
        return { success: false, error: message };
      }
    },
    [filters]
  );

  // ============================================
  // PAGINATION & FILTERS
  // ============================================
  const setPage = useCallback(
    (newPage: number) => {
      setPageState(newPage);
      void loadReservations(filters, { page: newPage, pageSize });
    },
    [filters, pageSize, loadReservations]
  );

  const setPageSize = useCallback(
    (newPageSize: number) => {
      setPageSizeState(newPageSize);
      setPageState(1);
      void loadReservations(filters, { page: 1, pageSize: newPageSize });
    },
    [filters, loadReservations]
  );

  const setFilters = useCallback(
    (newFilters: CompanyReservationFilters) => {
      setFiltersState(newFilters);
      setPageState(1);
      void loadReservations(newFilters, { page: 1, pageSize });
    },
    [pageSize, loadReservations]
  );

  const resetFilters = useCallback(() => {
    setFiltersState({});
    setPageState(1);
    void loadReservations({}, { page: 1, pageSize });
  }, [pageSize, loadReservations]);

  return {
    reservations,
    total,
    page,
    totalPages,
    pageSize,
    isLoading,
    error,
    stats,
    filters,
    shows,
    loadReservations,
    loadStats,
    loadShows,
    exportWithOptions,
    setPage,
    setPageSize,
    setFilters,
    resetFilters,
  };
}
