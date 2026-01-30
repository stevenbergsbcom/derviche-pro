/**
 * CompanyExportDialog - Dialog d'export des réservations pour les compagnies
 *
 * Permet d'exporter les réservations en CSV ou Excel avec :
 * - Sélection de la période (toutes, à venir, passées)
 * - Sélection du format (xlsx/csv)
 * - Sélection des colonnes à inclure (sans notes internes)
 * - Aperçu des données
 *
 * @refactorisé Session 113 - Pattern validé 19x
 */

'use client';

import { Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Types et hooks internes
import type { CompanyExportDialogProps } from './types';
import { useCompanyExportDialog } from './hooks';

// Composants internes
import {
  PeriodSelector,
  FormatSelector,
  ColumnSelector,
  PreviewTable,
  FiltersWarning,
  FilenamePreview,
} from './components';

// ============================================
// RE-EXPORTS POUR COMPATIBILITÉ
// ============================================

export type { CompanyExportDialogProps } from './types';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function CompanyExportDialog({
  open,
  onOpenChange,
  reservations,
  filters,
  visibleColumns,
  onExport,
  isExporting,
}: CompanyExportDialogProps) {
  // Hook centralisé pour état et actions
  const { state, actions, computed } = useCompanyExportDialog({
    reservations,
    filters,
    visibleColumns,
    onExport,
    onOpenChange,
  });

  return (
    <Dialog open={open} onOpenChange={actions.handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" aria-hidden="true" />
            Exporter les réservations
          </DialogTitle>
          <DialogDescription>
            Configurez les options d&apos;export ci-dessous
          </DialogDescription>
        </DialogHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Avertissement filtres actifs */}
          <FiltersWarning visible={computed.hasActivePageFilters} />

          {/* Sélection période */}
          <PeriodSelector
            value={state.period}
            onChange={actions.setPeriod}
          />

          {/* Sélection format */}
          <FormatSelector
            value={state.format}
            onChange={actions.setFormat}
          />

          {/* Sélection colonnes */}
          <ColumnSelector
            selectedColumns={state.selectedColumns}
            onToggleColumn={actions.toggleColumn}
            onSelectAll={actions.selectAll}
            onDeselectAll={actions.deselectAll}
            onUseDefaultColumns={actions.useDefaultColumns}
          />

          {/* Aperçu des données */}
          <PreviewTable
            reservations={computed.previewData}
            columns={computed.orderedSelectedColumns}
          />

          {/* Nom du fichier */}
          <FilenamePreview
            filename={computed.filename}
            format={state.format}
          />
        </div>

        {/* Footer avec actions */}
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            onClick={actions.handleExport}
            disabled={!computed.canExport || isExporting}
            className="w-full sm:w-auto bg-derviche hover:bg-derviche/90"
            aria-label={`Télécharger en format ${state.format.toUpperCase()}`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Télécharger ({state.format.toUpperCase()})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
