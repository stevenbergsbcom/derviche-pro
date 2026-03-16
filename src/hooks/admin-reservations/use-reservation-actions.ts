/**
 * Hook d'actions (mutations) pour les reservations admin
 * Check-in, modification, annulation, creation, export
 *
 * @module hooks/admin-reservations/use-reservation-actions
 */

'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import {
  updateReservationCheckin,
  updateReservation,
  cancelReservation,
  createAdminReservation,
  getAllReservationsForExport,
  type AdminReservation,
  type AdminReservationFilters,
  type CheckinUpdateData,
  type UpdateReservationData,
  type CreateAdminReservationData,
  type PaginationOptions,
} from '@/lib/services/admin-reservations';
import { logger } from '@/lib/logger';
import { generateExportFilename, type ExportOptions } from '@/components/admin/export-dialog';
import { CHECKIN_STATUS_LABELS, LEGACY_EXPORT_COLUMNS } from './constants';
import { reservationsToCSV, reservationsToExcel, downloadCSV, downloadExcel } from './helpers';

interface UseReservationActionsOptions {
  filters: AdminReservationFilters;
  page: number;
  pageSize: number;
  setReservations: Dispatch<SetStateAction<AdminReservation[]>>;
  loadReservations: (
    filters?: AdminReservationFilters,
    pagination?: PaginationOptions
  ) => Promise<{ success: boolean; error?: string }>;
  loadStats: (
    filters?: { showId?: string; slotId?: string; venueId?: string }
  ) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Hook de mutations et actions sur les reservations
 */
export function useReservationActions({
  filters,
  page,
  pageSize,
  setReservations,
  loadReservations,
  loadStats,
}: UseReservationActionsOptions) {
  // ─────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────

  const checkin = useCallback(
    async (
      id: string,
      data: CheckinUpdateData
    ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
      const result = await updateReservationCheckin(id, data);

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur checkin', { id, error: result.error });
        toast.error('Erreur lors de la mise a jour du check-in');
        return { success: false, error: result.error || 'Erreur de mise a jour' };
      }

      setReservations((prev) => prev.map((r) => (r.id === id ? result.data! : r)));

      const statusLabel = CHECKIN_STATUS_LABELS[data.checkinStatus] || data.checkinStatus;
      toast.success(`Check-in : ${statusLabel}`);

      return { success: true, data: result.data };
    },
    [setReservations]
  );

  const update = useCallback(
    async (
      id: string,
      data: UpdateReservationData
    ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
      const result = await updateReservation(id, data);

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur modification', { id, error: result.error });
        toast.error(result.error || 'Erreur lors de la modification');
        return { success: false, error: result.error || 'Erreur de modification' };
      }

      setReservations((prev) => prev.map((r) => (r.id === id ? result.data! : r)));
      toast.success('Reservation modifiee avec succes');

      return { success: true, data: result.data };
    },
    [setReservations]
  );

  const cancel = useCallback(
    async (
      id: string,
      reason?: string
    ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
      const result = await cancelReservation(id, reason);

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur annulation', { id, error: result.error });
        toast.error("Erreur lors de l'annulation");
        return { success: false, error: result.error || "Erreur d'annulation" };
      }

      setReservations((prev) => prev.map((r) => (r.id === id ? result.data! : r)));
      toast.success('Reservation annulee');

      // Note: l'email et la synchronisation Calendar sont geres par l'appelant
      // (page.tsx handleCancel) avec les options choisies par l'utilisateur (switches).
      // Ne pas declencher d'email ici pour eviter un double envoi.

      return { success: true, data: result.data };
    },
    [setReservations]
  );

  const create = useCallback(
    async (
      data: CreateAdminReservationData
    ): Promise<{ success: boolean; reservationId?: string; error?: string }> => {
      const result = await createAdminReservation(data);

      if (!result.success) {
        logger.error('useAdminReservations - Erreur creation', { error: result.error });
        toast.error(result.error || 'Erreur lors de la creation');
        return { success: false, error: result.error };
      }

      toast.success('Reservation creee avec succes');

      // Recharger les donnees
      void loadReservations(filters, { page, pageSize });
      void loadStats();

      return { success: true, reservationId: result.reservationId };
    },
    [filters, page, pageSize, loadReservations, loadStats]
  );

  // ─────────────────────────────────────────────────────────────
  // EXPORT
  // ─────────────────────────────────────────────────────────────

  const exportWithOptions = useCallback(
    async (options: ExportOptions): Promise<{ success: boolean; error?: string }> => {
      const { format, columns, period } = options;

      if (columns.length === 0) {
        toast.error('Veuillez selectionner au moins une colonne');
        return { success: false, error: 'Aucune colonne selectionnee' };
      }

      toast.info("Preparation de l'export...");

      const exportFilters: AdminReservationFilters = {
        ...filters,
        period: period === 'all' ? undefined : period,
      };

      const result = await getAllReservationsForExport(exportFilters);

      if (result.error) {
        logger.error('useAdminReservations - Erreur export', { error: result.error });
        toast.error("Erreur lors de l'export");
        return { success: false, error: result.error };
      }

      if (result.data.length === 0) {
        toast.warning('Aucune reservation a exporter');
        return { success: false, error: 'Aucune donnee' };
      }

      const showTitle =
        filters.showId && result.data.length > 0
          ? result.data[0]?.slot?.show?.title
          : undefined;
      const filename = generateExportFilename(exportFilters, format, period, showTitle);

      try {
        if (format === 'xlsx') {
          const excelData = reservationsToExcel(result.data, columns);
          downloadExcel(excelData, filename);
        } else {
          const csv = reservationsToCSV(result.data, columns);
          downloadCSV(csv, filename);
        }

        const count = result.data.length;
        toast.success(
          `${count} reservation${count > 1 ? 's' : ''} exportee${count > 1 ? 's' : ''} (${format.toUpperCase()})`
        );
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useAdminReservations - Erreur generation fichier', { message });
        toast.error('Erreur lors de la generation du fichier');
        return { success: false, error: message };
      }
    },
    [filters]
  );

  /** @deprecated Utiliser exportWithOptions */
  const exportToCSV = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    return exportWithOptions({ format: 'csv', columns: LEGACY_EXPORT_COLUMNS, period: 'all' });
  }, [exportWithOptions]);

  return {
    checkin,
    update,
    cancel,
    create,
    exportToCSV,
    exportWithOptions,
  };
}
