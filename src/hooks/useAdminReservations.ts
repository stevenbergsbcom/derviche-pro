/**
 * Hook useAdminReservations - Gestion des réservations côté admin
 * Derviche Diffusion
 * 
 * Fonctionnalités complètes :
 * - Liste paginée avec filtres
 * - Modification complète
 * - Check-in
 * - Annulation
 * - Export CSV et Excel avec colonnes personnalisées
 * - Statistiques
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  getAdminReservations,
  getAdminReservationById,
  updateReservationCheckin,
  updateReservation,
  cancelReservation,
  getReservationStats,
  getReservationsBySlot,
  getAllReservationsForExport,
  getAvailableSlotsForShow,
  type AdminReservation,
  type AdminReservationFilters,
  type PaginationOptions,
  type CheckinUpdateData,
  type UpdateReservationData,
  type ReservationStats,
} from '@/lib/services/admin-reservations';
import { logger } from '@/lib/logger';
import type { ReservationColumn } from '@/hooks/useUserPreferences';
import { generateExportFilename, type ExportOptions } from '@/components/admin/export-dialog';

// ============================================
// TYPES
// ============================================

export interface UseAdminReservationsReturn {
  /** Liste des réservations */
  reservations: AdminReservation[];
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
  stats: ReservationStats | null;
  /** Filtres actifs */
  filters: AdminReservationFilters;

  /** Charger les réservations avec filtres et pagination */
  loadReservations: (
    filters?: AdminReservationFilters,
    pagination?: PaginationOptions
  ) => Promise<{ success: boolean; error?: string }>;

  /** Charger une réservation par son ID */
  loadReservation: (id: string) => Promise<{ 
    success: boolean; 
    data?: AdminReservation; 
    error?: string 
  }>;

  /** Charger les réservations d'un slot */
  loadBySlot: (slotId: string) => Promise<{ success: boolean; error?: string }>;

  /** Charger les statistiques */
  loadStats: (filters?: { showId?: string; slotId?: string }) => Promise<{ 
    success: boolean; 
    error?: string 
  }>;

  /** Mettre à jour le check-in d'une réservation */
  checkin: (
    id: string,
    data: CheckinUpdateData
  ) => Promise<{ success: boolean; data?: AdminReservation; error?: string }>;

  /** Modifier une réservation complètement */
  update: (
    id: string,
    data: UpdateReservationData
  ) => Promise<{ success: boolean; data?: AdminReservation; error?: string }>;

  /** Annuler une réservation */
  cancel: (
    id: string,
    reason?: string
  ) => Promise<{ success: boolean; data?: AdminReservation; error?: string }>;

  /** @deprecated Utiliser exportWithOptions à la place */
  exportToCSV: () => Promise<{ success: boolean; error?: string }>;

  /** Exporter avec options (format et colonnes personnalisées) */
  exportWithOptions: (options: ExportOptions) => Promise<{ success: boolean; error?: string }>;

  /** Récupérer les slots disponibles pour un spectacle */
  getSlots: (showId: string) => Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      date: string;
      time: string;
      capacity: number;
      remainingCapacity: number;
      venue: { id: string; name: string; city: string } | null;
    }>;
    error?: string;
  }>;

  /** Changer de page */
  setPage: (page: number) => void;

  /** Changer le nombre d'éléments par page */
  setPageSize: (size: number) => void;

  /** Mettre à jour les filtres */
  setFilters: (filters: AdminReservationFilters) => void;

  /** Réinitialiser les filtres */
  resetFilters: () => void;
}

// ============================================
// HELPERS EXPORT
// ============================================

/** Labels des colonnes pour l'export */
const EXPORT_COLUMN_LABELS: Record<ReservationColumn, string> = {
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
  checkinInternalNotes: 'Notes internes',
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
function getCellValue(col: ReservationColumn, r: AdminReservation): string {
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
      return r.checkinComment || '-';
    case 'checkinVenueNotes':
      return r.checkinVenueNotes || '-';
    case 'checkinInternalNotes':
      return r.checkinInternalNotes || '-';
    case 'createdAt':
      // createdAt est un datetime complet, extraire juste la date
      return r.createdAt ? formatDateExport(r.createdAt.split('T')[0]) : '-';
    default:
      return '-';
  }
}

/**
 * Convertit les réservations en CSV avec colonnes personnalisées
 */
function reservationsToCSV(
  reservations: AdminReservation[],
  columns: ReservationColumn[]
): string {
  // En-têtes basés sur les colonnes sélectionnées
  const headers = columns.map((col) => EXPORT_COLUMN_LABELS[col]);

  // Fonction pour échapper les valeurs CSV (délimiteur: point-virgule)
  const escapeCSV = (value: string): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Si contient point-virgule, virgule, guillemet ou saut de ligne, entourer de guillemets
    if (str.includes(';') || str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Lignes de données
  const rows = reservations.map((r) =>
    columns.map((col) => escapeCSV(getCellValue(col, r)))
  );

  // Assembler le CSV avec BOM pour Excel
  const BOM = '\uFEFF';
  return BOM + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
}

/**
 * Convertit les réservations en Excel avec colonnes personnalisées
 */
function reservationsToExcel(
  reservations: AdminReservation[],
  columns: ReservationColumn[]
): Uint8Array {
  // En-têtes basés sur les colonnes sélectionnées
  const headers = columns.map((col) => EXPORT_COLUMN_LABELS[col]);

  // Données
  const data = reservations.map((r) =>
    columns.map((col) => getCellValue(col, r))
  );

  // Créer le workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Ajuster la largeur des colonnes
  const colWidths = columns.map((col, index) => {
    // Largeur basée sur le header + marge
    const headerLen = EXPORT_COLUMN_LABELS[col].length;
    // Trouver la largeur max des données
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

  // Ajouter la feuille
  XLSX.utils.book_append_sheet(wb, ws, 'Réservations');

  // Générer le fichier
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
  // Utiliser Uint8Array.from() pour créer une copie compatible avec Blob
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
// COLONNES PAR DÉFAUT POUR L'EXPORT LEGACY
// ============================================

const LEGACY_EXPORT_COLUMNS: ReservationColumn[] = [
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
];

// ============================================
// HOOK
// ============================================

export function useAdminReservations(
  initialPageSize: number = 20
): UseAdminReservationsReturn {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [filters, setFiltersState] = useState<AdminReservationFilters>({});
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Ref pour éviter les race conditions
  const loadingRef = useRef<string | null>(null);

  // ============================================
  // LOAD RESERVATIONS
  // ============================================
  const loadReservations = useCallback(
    async (
      newFilters?: AdminReservationFilters,
      pagination?: PaginationOptions
    ): Promise<{ success: boolean; error?: string }> => {
      const requestId = Date.now().toString();
      loadingRef.current = requestId;

      const activeFilters = newFilters ?? filters;
      const activePagination = pagination ?? { page, pageSize };

      setIsLoading(true);
      setError(null);

      const result = await getAdminReservations(activeFilters, activePagination);

      // Vérifier que la requête est toujours d'actualité
      if (loadingRef.current !== requestId) {
        return { success: false, error: 'Requête annulée' };
      }

      setIsLoading(false);
      loadingRef.current = null;

      if (result.error) {
        setError(result.error);
        logger.error('useAdminReservations - Erreur chargement', {
          error: result.error,
        });
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
  // LOAD SINGLE RESERVATION
  // ============================================
  const loadReservation = useCallback(
    async (
      id: string
    ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
      const result = await getAdminReservationById(id);

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur chargement réservation', {
          id,
          error: result.error,
        });
        return {
          success: false,
          error: result.error || 'Réservation non trouvée',
        };
      }

      return { success: true, data: result.data };
    },
    []
  );

  // ============================================
  // LOAD BY SLOT
  // ============================================
  const loadBySlot = useCallback(
    async (slotId: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      setError(null);

      const result = await getReservationsBySlot(slotId);

      setIsLoading(false);

      if (result.error) {
        setError(result.error);
        toast.error('Erreur lors du chargement des réservations');
        return { success: false, error: result.error };
      }

      setReservations(result.data);
      setTotal(result.data.length);
      setTotalPages(1);

      return { success: true };
    },
    []
  );

  // ============================================
  // LOAD STATS
  // ============================================
  const loadStats = useCallback(
    async (
      statFilters?: { showId?: string; slotId?: string }
    ): Promise<{ success: boolean; error?: string }> => {
      const result = await getReservationStats(statFilters || {});

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur chargement stats', {
          error: result.error,
        });
        return {
          success: false,
          error: result.error || 'Erreur lors du chargement',
        };
      }

      setStats(result.data);
      return { success: true };
    },
    []
  );

  // ============================================
  // CHECKIN
  // ============================================
  const checkin = useCallback(
    async (
      id: string,
      data: CheckinUpdateData
    ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
      const result = await updateReservationCheckin(id, data);

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur checkin', {
          id,
          error: result.error,
        });
        toast.error('Erreur lors de la mise à jour du check-in');
        return { success: false, error: result.error || 'Erreur de mise à jour' };
      }

      // Mettre à jour la liste locale
      setReservations((prev) => prev.map((r) => (r.id === id ? result.data! : r)));

      // Message toast selon le statut
      const statusLabels: Record<string, string> = {
        present_loved: '❤️ Présent - A aimé',
        present_press: '📰 Présent - Presse',
        present_neutral: '😐 Présent - Neutre',
        absent: '❌ Absent',
      };
      const statusLabel = statusLabels[data.checkinStatus] || data.checkinStatus;
      toast.success(`Check-in : ${statusLabel}`);

      return { success: true, data: result.data };
    },
    []
  );

  // ============================================
  // UPDATE (modification complète)
  // ============================================
  const update = useCallback(
    async (
      id: string,
      data: UpdateReservationData
    ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
      const result = await updateReservation(id, data);

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur modification', {
          id,
          error: result.error,
        });
        toast.error(result.error || 'Erreur lors de la modification');
        return { success: false, error: result.error || 'Erreur de modification' };
      }

      // Mettre à jour la liste locale
      setReservations((prev) => prev.map((r) => (r.id === id ? result.data! : r)));

      toast.success('Réservation modifiée avec succès');
      return { success: true, data: result.data };
    },
    []
  );

  // ============================================
  // CANCEL
  // ============================================
  const cancel = useCallback(
    async (
      id: string,
      reason?: string
    ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
      const result = await cancelReservation(id, reason);

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur annulation', {
          id,
          error: result.error,
        });
        toast.error("Erreur lors de l'annulation");
        return { success: false, error: result.error || "Erreur d'annulation" };
      }

      // Mettre à jour la liste locale
      setReservations((prev) => prev.map((r) => (r.id === id ? result.data! : r)));

      toast.success('Réservation annulée');
      return { success: true, data: result.data };
    },
    []
  );

  // ============================================
  // EXPORT AVEC OPTIONS (CSV ou Excel + colonnes + période)
  // ============================================
  const exportWithOptions = useCallback(
    async (options: ExportOptions): Promise<{ success: boolean; error?: string }> => {
      const { format, columns, period } = options;

      if (columns.length === 0) {
        toast.error('Veuillez sélectionner au moins une colonne');
        return { success: false, error: 'Aucune colonne sélectionnée' };
      }

      toast.info('Préparation de l\'export...');

      // Combiner les filtres de la page avec la période choisie dans le dialog
      const exportFilters: AdminReservationFilters = {
        ...filters,
        // La période du dialog écrase celle de la page
        period: period === 'all' ? undefined : period,
      };

      const result = await getAllReservationsForExport(exportFilters);

      if (result.error) {
        logger.error('useAdminReservations - Erreur export', { error: result.error });
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
      const filename = generateExportFilename(exportFilters, format, period, showTitle);

      try {
        if (format === 'xlsx') {
          // Export Excel
          const excelData = reservationsToExcel(result.data, columns);
          downloadExcel(excelData, filename);
        } else {
          // Export CSV
          const csv = reservationsToCSV(result.data, columns);
          downloadCSV(csv, filename);
        }

        toast.success(
          `${result.data.length} réservation${result.data.length > 1 ? 's' : ''} exportée${result.data.length > 1 ? 's' : ''} (${format.toUpperCase()})`
        );
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useAdminReservations - Erreur génération fichier', { message });
        toast.error('Erreur lors de la génération du fichier');
        return { success: false, error: message };
      }
    },
    [filters]
  );

  // ============================================
  // EXPORT CSV (LEGACY - pour compatibilité)
  // ============================================
  const exportToCSV = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    return exportWithOptions({ format: 'csv', columns: LEGACY_EXPORT_COLUMNS, period: 'all' });
  }, [exportWithOptions]);

  // ============================================
  // GET SLOTS FOR SHOW
  // ============================================
  const getSlots = useCallback(async (showId: string) => {
    const result = await getAvailableSlotsForShow(showId);

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  }, []);

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
      setPageState(1); // Revenir à la page 1 quand on change le nombre par page
      void loadReservations(filters, { page: 1, pageSize: newPageSize });
    },
    [filters, loadReservations]
  );

  const setFilters = useCallback(
    (newFilters: AdminReservationFilters) => {
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
    loadReservations,
    loadReservation,
    loadBySlot,
    loadStats,
    checkin,
    update,
    cancel,
    exportToCSV,
    exportWithOptions,
    getSlots,
    setPage,
    setPageSize,
    setFilters,
    resetFilters,
  };
}
