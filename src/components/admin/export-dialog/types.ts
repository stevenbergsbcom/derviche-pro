/**
 * Types pour le composant ExportDialog
 * Gestion des exports de réservations (CSV/XLSX)
 */

import type { ReservationColumn } from '@/hooks/useUserPreferences';
import type { AdminReservation, AdminReservationFilters } from '@/lib/services/admin-reservations';

// ============================================
// TYPES DE BASE
// ============================================

/** Format d'export disponible */
export type ExportFormat = 'csv' | 'xlsx';

/** Période de filtrage pour l'export */
export type ExportPeriod = 'all' | 'upcoming' | 'past';

/** Options d'export sélectionnées par l'utilisateur */
export interface ExportOptions {
  format: ExportFormat;
  columns: ReservationColumn[];
  period: ExportPeriod;
}

/** Résultat d'une opération d'export */
export interface ExportResult {
  success: boolean;
  error?: string;
}

// ============================================
// PROPS DES COMPOSANTS
// ============================================

/** Props du composant ExportDialog principal */
export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservations: AdminReservation[];
  filters: AdminReservationFilters;
  visibleColumns: ReservationColumn[];
  onExport: (options: ExportOptions) => Promise<ExportResult>;
  isExporting: boolean;
}

/** Props du sélecteur de période */
export interface PeriodSelectorProps {
  value: ExportPeriod;
  onChange: (period: ExportPeriod) => void;
}

/** Props du sélecteur de format */
export interface FormatSelectorProps {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
}

/** Props du sélecteur de colonnes */
export interface ColumnSelectorProps {
  selectedColumns: ReservationColumn[];
  onToggleColumn: (col: ReservationColumn) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onUseTableColumns: () => void;
}

/** Props du tableau d'aperçu */
export interface PreviewTableProps {
  reservations: AdminReservation[];
  columns: ReservationColumn[];
}

/** Props de l'avertissement filtres */
export interface FiltersWarningProps {
  visible: boolean;
}

/** Props de l'aperçu du nom de fichier */
export interface FilenamePreviewProps {
  filename: string;
  format: ExportFormat;
}

// ============================================
// TYPES INTERNES
// ============================================

/** Configuration d'une option de période (sans icon, ajouté au rendu) */
export interface PeriodOptionData {
  value: ExportPeriod;
  label: string;
  description: string;
}

/** État du hook useExportDialog */
export interface ExportDialogState {
  format: ExportFormat;
  period: ExportPeriod;
  selectedColumns: ReservationColumn[];
}

/** Actions du hook useExportDialog */
export interface ExportDialogActions {
  setFormat: (format: ExportFormat) => void;
  setPeriod: (period: ExportPeriod) => void;
  toggleColumn: (col: ReservationColumn) => void;
  selectAll: () => void;
  deselectAll: () => void;
  useTableColumns: () => void;
  handleExport: () => Promise<void>;
  handleOpenChange: (open: boolean) => void;
}

/** Valeurs calculées du hook useExportDialog */
export interface ExportDialogComputed {
  orderedSelectedColumns: ReservationColumn[];
  previewData: AdminReservation[];
  filename: string;
  hasActivePageFilters: boolean;
  canExport: boolean;
}

/** Retour complet du hook useExportDialog */
export interface UseExportDialogReturn {
  state: ExportDialogState;
  actions: ExportDialogActions;
  computed: ExportDialogComputed;
}
