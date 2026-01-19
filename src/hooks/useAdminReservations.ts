/**
 * Hook useAdminReservations - Gestion des réservations côté admin
 * Derviche Diffusion
 * 
 * Fonctionnalités complètes :
 * - Liste paginée avec filtres
 * - Modification complète
 * - Check-in
 * - Annulation
 * - Export CSV
 * - Statistiques
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
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

  /** Exporter en CSV (applique les filtres actuels) */
  exportToCSV: () => Promise<{ success: boolean; error?: string }>;

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
// HELPERS EXPORT CSV
// ============================================

/**
 * Convertit les réservations en CSV
 */
function reservationsToCSV(reservations: AdminReservation[]): string {
  // En-têtes
  const headers = [
    'Date représentation',
    'Heure',
    'Spectacle',
    'Compagnie',
    'Lieu',
    'Ville lieu',
    'Prénom',
    'Nom',
    'Email',
    'Téléphone',
    'Email secondaire',
    'Tél. secondaire',
    'Structure',
    'Fonction',
    'N° AFC',
    'Adresse',
    'Code postal',
    'Ville',
    'Nb places',
    'Statut',
    'Check-in',
    'Demandes spéciales',
    'Notes check-in',
    'Notes lieu',
    'Notes internes',
    'Créé le',
    'Modifié le',
    'Annulé le',
    'Motif annulation',
  ];

  // Fonction pour échapper les valeurs CSV (délimiteur: point-virgule)
  const escapeCSV = (value: string | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Si contient point-virgule, virgule, guillemet ou saut de ligne, entourer de guillemets
    if (str.includes(';') || str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Traduire les statuts
  const translateStatus = (status: string): string => {
    const map: Record<string, string> = {
      'confirmed': 'Confirmée',
      'cancelled': 'Annulée',
      'no_show': 'No-show',
    };
    return map[status] || status;
  };

  const translateCheckin = (status: string | null): string => {
    if (!status) return '';
    const map: Record<string, string> = {
      'present_loved': 'Présent - A aimé',
      'present_press': 'Présent - Presse',
      'present_neutral': 'Présent - Neutre',
      'absent': 'Absent',
    };
    return map[status] || status;
  };

  // Formater les dates
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR');
  };

  const formatDateTime = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR');
  };

  // Lignes de données
  const rows = reservations.map(r => [
    escapeCSV(r.slot?.date ? formatDate(r.slot.date) : ''),
    escapeCSV(r.slot?.time || ''),
    escapeCSV(r.slot?.show?.title || ''),
    escapeCSV(r.slot?.show?.company?.name || ''),
    escapeCSV(r.slot?.venue?.name || ''),
    escapeCSV(r.slot?.venue?.city || ''),
    escapeCSV(r.firstName),
    escapeCSV(r.lastName),
    escapeCSV(r.email),
    escapeCSV(r.phone),
    escapeCSV(r.emailSecondary),
    escapeCSV(r.phoneSecondary),
    escapeCSV(r.organization),
    escapeCSV(r.function),
    escapeCSV(r.afcNumber),
    escapeCSV(r.address),
    escapeCSV(r.postalCode),
    escapeCSV(r.city),
    String(r.numPlaces),
    escapeCSV(translateStatus(r.status)),
    escapeCSV(translateCheckin(r.checkinStatus)),
    escapeCSV(r.specialRequests),
    escapeCSV(r.checkinComment),
    escapeCSV(r.checkinVenueNotes),
    escapeCSV(r.checkinInternalNotes),
    escapeCSV(formatDateTime(r.createdAt)),
    escapeCSV(formatDateTime(r.updatedAt)),
    escapeCSV(r.cancelledAt ? formatDateTime(r.cancelledAt) : ''),
    escapeCSV(r.cancellationReason),
  ]);

  // Assembler le CSV avec BOM pour Excel
  const BOM = '\uFEFF';
  return BOM + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
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
  const loadReservations = useCallback(async (
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
      logger.error('useAdminReservations - Erreur chargement', { error: result.error });
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
  }, [filters, page, pageSize]);

  // ============================================
  // LOAD SINGLE RESERVATION
  // ============================================
  const loadReservation = useCallback(async (
    id: string
  ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
    const result = await getAdminReservationById(id);

    if (result.error || !result.data) {
      logger.error('useAdminReservations - Erreur chargement réservation', { id, error: result.error });
      return { success: false, error: result.error || 'Réservation non trouvée' };
    }

    return { success: true, data: result.data };
  }, []);

  // ============================================
  // LOAD BY SLOT
  // ============================================
  const loadBySlot = useCallback(async (
    slotId: string
  ): Promise<{ success: boolean; error?: string }> => {
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
  }, []);

  // ============================================
  // LOAD STATS
  // ============================================
  const loadStats = useCallback(async (
    statFilters?: { showId?: string; slotId?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await getReservationStats(statFilters || {});

    if (result.error || !result.data) {
      logger.error('useAdminReservations - Erreur chargement stats', { error: result.error });
      return { success: false, error: result.error || 'Erreur lors du chargement' };
    }

    setStats(result.data);
    return { success: true };
  }, []);

  // ============================================
  // CHECKIN
  // ============================================
  const checkin = useCallback(async (
    id: string,
    data: CheckinUpdateData
  ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
    const result = await updateReservationCheckin(id, data);

    if (result.error || !result.data) {
      logger.error('useAdminReservations - Erreur checkin', { id, error: result.error });
      toast.error('Erreur lors de la mise à jour du check-in');
      return { success: false, error: result.error || 'Erreur de mise à jour' };
    }

    // Mettre à jour la liste locale
    setReservations(prev => 
      prev.map(r => r.id === id ? result.data! : r)
    );

    // Message toast selon le statut
    const statusLabels: Record<string, string> = {
      'present_loved': '❤️ Présent - A aimé',
      'present_press': '📰 Présent - Presse',
      'present_neutral': '😐 Présent - Neutre',
      'absent': '❌ Absent',
    };
    const statusLabel = statusLabels[data.checkinStatus] || data.checkinStatus;
    toast.success(`Check-in : ${statusLabel}`);

    return { success: true, data: result.data };
  }, []);

  // ============================================
  // UPDATE (modification complète)
  // ============================================
  const update = useCallback(async (
    id: string,
    data: UpdateReservationData
  ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
    const result = await updateReservation(id, data);

    if (result.error || !result.data) {
      logger.error('useAdminReservations - Erreur modification', { id, error: result.error });
      toast.error(result.error || 'Erreur lors de la modification');
      return { success: false, error: result.error || 'Erreur de modification' };
    }

    // Mettre à jour la liste locale
    setReservations(prev => 
      prev.map(r => r.id === id ? result.data! : r)
    );

    toast.success('Réservation modifiée avec succès');
    return { success: true, data: result.data };
  }, []);

  // ============================================
  // CANCEL
  // ============================================
  const cancel = useCallback(async (
    id: string,
    reason?: string
  ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
    const result = await cancelReservation(id, reason);

    if (result.error || !result.data) {
      logger.error('useAdminReservations - Erreur annulation', { id, error: result.error });
      toast.error('Erreur lors de l\'annulation');
      return { success: false, error: result.error || 'Erreur d\'annulation' };
    }

    // Mettre à jour la liste locale
    setReservations(prev => 
      prev.map(r => r.id === id ? result.data! : r)
    );

    toast.success('Réservation annulée');
    return { success: true, data: result.data };
  }, []);

  // ============================================
  // EXPORT CSV
  // ============================================
  const exportToCSV = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    toast.info('Préparation de l\'export...');

    const result = await getAllReservationsForExport(filters);

    if (result.error) {
      logger.error('useAdminReservations - Erreur export', { error: result.error });
      toast.error('Erreur lors de l\'export');
      return { success: false, error: result.error };
    }

    if (result.data.length === 0) {
      toast.warning('Aucune réservation à exporter');
      return { success: false, error: 'Aucune donnée' };
    }

    // Générer le CSV
    const csv = reservationsToCSV(result.data);

    // Générer le nom du fichier
    const date = new Date().toISOString().split('T')[0];
    let filename = `reservations_${date}`;
    
    // Ajouter le contexte si filtré
    if (filters.showId) {
      const show = result.data[0]?.slot?.show?.title;
      if (show) {
        // Nettoyer le titre pour le nom de fichier
        const cleanTitle = show.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        filename = `reservations_${cleanTitle}_${date}`;
      }
    }

    filename += '.csv';

    // Télécharger
    downloadCSV(csv, filename);

    toast.success(`${result.data.length} réservation(s) exportée(s)`);
    return { success: true };
  }, [filters]);

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
  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
    void loadReservations(filters, { page: newPage, pageSize });
  }, [filters, pageSize, loadReservations]);

  const setPageSize = useCallback((newPageSize: number) => {
    setPageSizeState(newPageSize);
    setPageState(1); // Revenir à la page 1 quand on change le nombre par page
    void loadReservations(filters, { page: 1, pageSize: newPageSize });
  }, [filters, loadReservations]);

  const setFilters = useCallback((newFilters: AdminReservationFilters) => {
    setFiltersState(newFilters);
    setPageState(1);
    void loadReservations(newFilters, { page: 1, pageSize });
  }, [pageSize, loadReservations]);

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
    getSlots,
    setPage,
    setPageSize,
    setFilters,
    resetFilters,
  };
}
