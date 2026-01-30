/**
 * Hook personnalisé pour la gestion de l'état et des actions du dialog d'export
 */

import { useState, useMemo, useCallback } from 'react';
import { DEFAULT_COLUMNS_ORDER, type ReservationColumn } from '@/hooks/useUserPreferences';
import type { AdminReservation, AdminReservationFilters } from '@/lib/services/admin-reservations';
import type {
  ExportFormat,
  ExportPeriod,
  ExportOptions,
  ExportResult,
  UseExportDialogReturn,
} from '../types';
import {
  generateExportFilename,
  hasActiveFilters,
  getInitialPeriod,
} from '../utils';
import { PREVIEW_MAX_ROWS } from '../constants';

// ============================================
// TYPES INTERNES
// ============================================

interface UseExportDialogParams {
  reservations: AdminReservation[];
  filters: AdminReservationFilters;
  visibleColumns: ReservationColumn[];
  onExport: (options: ExportOptions) => Promise<ExportResult>;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useExportDialog({
  reservations,
  filters,
  visibleColumns,
  onExport,
  onOpenChange,
}: UseExportDialogParams): UseExportDialogReturn {
  // ============================================
  // ÉTAT LOCAL
  // ============================================

  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [period, setPeriod] = useState<ExportPeriod>(() => getInitialPeriod(filters));
  const [selectedColumns, setSelectedColumns] = useState<ReservationColumn[]>(visibleColumns);

  // ============================================
  // ACTIONS
  // ============================================

  /** Toggle une colonne dans la sélection */
  const toggleColumn = useCallback((col: ReservationColumn) => {
    setSelectedColumns((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : [...prev, col]
    );
  }, []);

  /** Sélectionner toutes les colonnes */
  const selectAll = useCallback(() => {
    setSelectedColumns([...DEFAULT_COLUMNS_ORDER]);
  }, []);

  /** Désélectionner toutes les colonnes */
  const deselectAll = useCallback(() => {
    setSelectedColumns([]);
  }, []);

  /** Utiliser les colonnes visibles du tableau */
  const useTableColumns = useCallback(() => {
    setSelectedColumns(visibleColumns);
  }, [visibleColumns]);

  /** Handler pour l'ouverture/fermeture du dialog */
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen) {
      // Reset état quand le dialog s'ouvre
      setSelectedColumns(visibleColumns);
      setFormat('xlsx');
      setPeriod(getInitialPeriod(filters));
    }
    onOpenChange(newOpen);
  }, [visibleColumns, filters, onOpenChange]);

  // ============================================
  // VALEURS CALCULÉES
  // ============================================

  /** Colonnes sélectionnées triées selon l'ordre par défaut */
  const orderedSelectedColumns = useMemo(() => {
    return DEFAULT_COLUMNS_ORDER.filter((col) => selectedColumns.includes(col));
  }, [selectedColumns]);

  /** Aperçu des données (premières lignes) */
  const previewData = useMemo(() => {
    return reservations.slice(0, PREVIEW_MAX_ROWS);
  }, [reservations]);

  /** Nom de fichier généré (sans titre spectacle car données paginées) */
  const filename = useMemo(() => {
    return generateExportFilename(filters, format, period, undefined);
  }, [filters, format, period]);

  /** Détection des filtres actifs sur la page */
  const hasActivePageFilters = useMemo(() => {
    return hasActiveFilters(filters);
  }, [filters]);

  /** Validation: peut exporter si au moins une colonne sélectionnée */
  const canExport = selectedColumns.length > 0;

  // ============================================
  // HANDLER EXPORT
  // ============================================

  const handleExport = useCallback(async () => {
    const result = await onExport({
      format,
      columns: orderedSelectedColumns,
      period,
    });

    if (result.success) {
      onOpenChange(false);
    }
  }, [format, orderedSelectedColumns, period, onExport, onOpenChange]);

  // ============================================
  // RETOUR
  // ============================================

  return {
    state: {
      format,
      period,
      selectedColumns,
    },
    actions: {
      setFormat,
      setPeriod,
      toggleColumn,
      selectAll,
      deselectAll,
      useTableColumns,
      handleExport,
      handleOpenChange,
    },
    computed: {
      orderedSelectedColumns,
      previewData,
      filename,
      hasActivePageFilters,
      canExport,
    },
  };
}
