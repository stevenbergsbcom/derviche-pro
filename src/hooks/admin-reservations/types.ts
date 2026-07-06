/**
 * Types pour useAdminReservations
 * @module hooks/admin-reservations/types
 */

import type {
  AdminReservation,
  AdminReservationFilters,
  PaginationOptions,
  CheckinUpdateData,
  UpdateReservationData,
  ReservationStats,
  CreateAdminReservationData,
} from '@/lib/services/admin-reservations';
import type { ExportOptions } from '@/components/admin/export-dialog';

/**
 * Interface de retour du hook useAdminReservations
 */
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
    error?: string;
  }>;

  /** Charger les réservations d'un slot */
  loadBySlot: (slotId: string) => Promise<{ success: boolean; error?: string }>;

  /** Charger les statistiques */
  loadStats: (filters?: { showId?: string; slotId?: string }) => Promise<{
    success: boolean;
    error?: string;
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

  /** Créer une nouvelle réservation (admin) */
  create: (
    data: CreateAdminReservationData
  ) => Promise<{ success: boolean; reservationId?: string; error?: string }>;

  /** @deprecated Utiliser exportWithOptions à la place */
  exportToCSV: () => Promise<{ success: boolean; error?: string }>;

  /** Exporter avec options (format et colonnes personnalisées) */
  exportWithOptions: (
    options: ExportOptions
  ) => Promise<{ success: boolean; error?: string }>;

  /**
   * Récupérer les slots disponibles pour un spectacle.
   * @param options.includePast Inclut les représentations passées
   *   (réservé aux rôles super-admin/admin, vérifié côté service).
   */
  getSlots: (
    showId: string,
    options?: { includePast?: boolean },
  ) => Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      date: string;
      time: string;
      capacity: number;
      remainingCapacity: number;
      venue: { id: string; name: string; city: string } | null;
      isPast: boolean;
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

  /** Mettre à jour un champ en place sans rechargement (préserve l'ordre du tableau) */
  patchReservation: (id: string, patch: Partial<AdminReservation>) => void;
}

/**
 * Résultat d'une opération asynchrone
 */
export interface AsyncResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Slot disponible pour réservation
 */
export interface AvailableSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  remainingCapacity: number;
  venue: { id: string; name: string; city: string } | null;
  /**
   * True si la date/heure du slot est déjà passée par rapport à maintenant.
   * Cohérent avec le type source `src/lib/services/admin-reservations/types.ts`.
   */
  isPast: boolean;
}
