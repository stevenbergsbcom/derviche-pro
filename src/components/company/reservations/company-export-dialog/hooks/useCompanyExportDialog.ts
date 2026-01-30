/**
 * Hook personnalisé pour la gestion de l'état et des actions du dialog d'export compagnie
 */

import { useState, useMemo, useCallback } from 'react';
import {
  COMPANY_COLUMNS_ORDER,
  COMPANY_DEFAULT_VISIBLE_COLUMNS,
  generateCompanyExportFilename,
  type CompanyExportOptions,
  type CompanyExportColumn,
} from '@/hooks/useCompanyReservations';
import type { CompanyReservation, CompanyReservationFilters } from '@/lib/services/company-reservations';
import type {
  ExportFormat,
  ExportPeriod,
  ExportResult,
  UseCompanyExportDialogReturn,
} from '../types';
import {
  hasActiveFilters,
  getInitialPeriod,
} from '../utils';
import { PREVIEW_MAX_ROWS } from '../constants';

// ============================================
// TYPES INTERNES
// ============================================

interface UseCompanyExportDialogParams {
  reservations: CompanyReservation[];
  filters: CompanyReservationFilters;
  visibleColumns: CompanyExportColumn[];
  onExport: (options: CompanyExportOptions) => Promise<ExportResult>;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useCompanyExportDialog({
  reservations,
  filters,
  visibleColumns,
  onExport,
  onOpenChange,
}: UseCompanyExportDialogParams): UseCompanyExportDialogReturn {
  // ============================================
  // ÉTAT LOCAL
  // ============================================

  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [period, setPeriod] = useState<ExportPeriod>(() => getInitialPeriod(filters));
  const [selectedColumns, setSelectedColumns] = useState<CompanyExportColumn[]>(visibleColumns);

  // ============================================
  // ACTIONS
  // ============================================

  /** Toggle une colonne dans la sélection */
  const toggleColumn = useCallback((col: CompanyExportColumn) => {
    setSelectedColumns((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : [...prev, col]
    );
  }, []);

  /** Sélectionner toutes les colonnes */
  const selectAll = useCallback(() => {
    setSelectedColumns([...COMPANY_COLUMNS_ORDER]);
  }, []);

  /** Désélectionner toutes les colonnes */
  const deselectAll = useCallback(() => {
    setSelectedColumns([]);
  }, []);

  /** Utiliser les colonnes par défaut */
  const useDefaultColumns = useCallback(() => {
    setSelectedColumns([...COMPANY_DEFAULT_VISIBLE_COLUMNS]);
  }, []);

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
    return COMPANY_COLUMNS_ORDER.filter((col) => selectedColumns.includes(col));
  }, [selectedColumns]);

  /** Aperçu des données (premières lignes) */
  const previewData = useMemo(() => {
    return reservations.slice(0, PREVIEW_MAX_ROWS);
  }, [reservations]);

  /** Nom de fichier généré */
  const filename = useMemo(() => {
    return generateCompanyExportFilename(filters, format, period, undefined);
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
      useDefaultColumns,
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
