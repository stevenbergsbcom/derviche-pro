/**
 * Types pour le composant CompanyExportDialog
 * Gestion des exports de réservations pour les compagnies (CSV/XLSX)
 */

import type { CompanyExportColumn } from '@/hooks/useCompanyReservations';
import type { CompanyReservation, CompanyReservationFilters } from '@/lib/services/company-reservations';

// ============================================
// TYPES DE BASE
// ============================================

/** Format d'export disponible */
export type ExportFormat = 'csv' | 'xlsx';

/** Période de filtrage pour l'export */
export type ExportPeriod = 'all' | 'upcoming' | 'past';

/** Options d'export sélectionnées par l'utilisateur */
export interface CompanyExportOptions {
  format: ExportFormat;
  columns: CompanyExportColumn[];
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

/** Props du composant CompanyExportDialog principal */
export interface CompanyExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservations: CompanyReservation[];
  filters: CompanyReservationFilters;
  visibleColumns: CompanyExportColumn[];
  onExport: (options: CompanyExportOptions) => Promise<ExportResult>;
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
  selectedColumns: CompanyExportColumn[];
  onToggleColumn: (col: CompanyExportColumn) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onUseDefaultColumns: () => void;
}

/** Props du tableau d'aperçu */
export interface PreviewTableProps {
  reservations: CompanyReservation[];
  columns: CompanyExportColumn[];
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

/** État du hook useCompanyExportDialog */
export interface CompanyExportDialogState {
  format: ExportFormat;
  period: ExportPeriod;
  selectedColumns: CompanyExportColumn[];
}

/** Actions du hook useCompanyExportDialog */
export interface CompanyExportDialogActions {
  setFormat: (format: ExportFormat) => void;
  setPeriod: (period: ExportPeriod) => void;
  toggleColumn: (col: CompanyExportColumn) => void;
  selectAll: () => void;
  deselectAll: () => void;
  useDefaultColumns: () => void;
  handleExport: () => Promise<void>;
  handleOpenChange: (open: boolean) => void;
}

/** Valeurs calculées du hook useCompanyExportDialog */
export interface CompanyExportDialogComputed {
  orderedSelectedColumns: CompanyExportColumn[];
  previewData: CompanyReservation[];
  filename: string;
  hasActivePageFilters: boolean;
  canExport: boolean;
}

/** Retour complet du hook useCompanyExportDialog */
export interface UseCompanyExportDialogReturn {
  state: CompanyExportDialogState;
  actions: CompanyExportDialogActions;
  computed: CompanyExportDialogComputed;
}
