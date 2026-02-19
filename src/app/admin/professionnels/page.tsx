/**
 * Page Admin Professionnels - Orchestrateur
 * Derviche Diffusion
 *
 * Gestion des comptes programmateurs (professionnels).
 * Session 128 - Architecture modulaire.
 */

'use client';

import { useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Columns2, Download, Loader2 } from 'lucide-react';
import { AdminPageHeader, LoadingState, ErrorState } from '@/components/admin';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { useProfessionalsPage } from './hooks';
import {
  ProfessionalsFilters,
  ProfessionalsTable,
  ProfessionalsMobileCards,
  ProfessionalModal,
  ProfessionalColumnSelectorDialog,
} from '@/components/admin/professionnels';
import { useProfessionalsColumnsPreference } from '@/hooks/useUserPreferences';
import { exportProfessionals } from '@/lib/utils/export-professionals';
import type { ExportFormat } from '@/lib/utils/export-professionals';
import { toast } from 'sonner';
import { MESSAGES, LABELS, DELETE_DIALOG } from './constants';

export default function AdminProfessionnelsPage() {
  // ---- Préférences colonnes ----
  const { visibleColumns, isLoading: colsLoading, setVisibleColumns } = useProfessionalsColumnsPreference();
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [isSavingCols, setIsSavingCols] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const {
    // Données
    professionals,
    filteredProfessionals,
    availableCities,
    isLoading,
    error,

    // Filtres
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    cityFilter,
    setCityFilter,
    hasFilters,

    // Drawer
    drawerState,
    openDrawer,
    closeDrawer,

    // Suppression
    professionalToDelete,
    deleteError,
    handleDeleteClick,
    handleConfirmDelete,
    handleDeleteDialogChange,

    // Actions
    isSubmitting,
    handleToggleStatus,
    handleUpdate,

    // Refresh + formatage
    refresh,
    formatName,
    formatNameShort,
  } = useProfessionalsPage();

  // ---- Handlers colonnes + export ----
  const handleSaveColumns = async (cols: typeof visibleColumns) => {
    setIsSavingCols(true);
    const result = await setVisibleColumns(cols);
    setIsSavingCols(false);
    if (result.success) {
      setColumnsDialogOpen(false);
      toast.success('Colonnes enregistrées');
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
    return result;
  };

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    const result = await exportProfessionals(filteredProfessionals, {
      format,
      visibleColumns,
    });
    setIsExporting(false);
    if (!result.success) {
      toast.error(result.error ?? 'Erreur lors de l\'export');
    } else {
      toast.success(`Export ${format.toUpperCase()} téléchargé`);
    }
  };

  // ---- État de chargement ----
  if (isLoading) {
    return <LoadingState message={MESSAGES.LOADING} />;
  }

  // ---- Erreur ----
  if (error) {
    return (
      <ErrorState
        message={`${MESSAGES.ERROR_PREFIX}${error}`}
        onRetry={() => void refresh()}
      >
        <AdminPageHeader
          title={LABELS.PAGE_TITLE}
          subtitle={LABELS.PAGE_SUBTITLE}
        />
      </ErrorState>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ---- Header ---- */}
        <div className="flex items-start justify-between gap-4">
          <AdminPageHeader
            title={LABELS.PAGE_TITLE}
            subtitle={LABELS.PAGE_SUBTITLE}
          />
          <div className="flex items-center gap-2 shrink-0 pt-1">
            {/* Bouton colonnes */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setColumnsDialogOpen(true)}
              disabled={colsLoading}
              className="gap-1.5"
            >
              <Columns2 className="h-4 w-4" />
              <span className="hidden sm:inline">Colonnes</span>
            </Button>

            {/* Bouton export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExporting || filteredProfessionals.length === 0}
                  className="gap-1.5"
                >
                  {isExporting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Download className="h-4 w-4" />}
                  <span className="hidden sm:inline">Exporter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void handleExport('csv')}>
                  CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport('xlsx')}>
                  Excel (.xlsx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ---- Filtres ---- */}
        <ProfessionalsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          cityFilter={cityFilter}
          onCityFilterChange={setCityFilter}
          availableCities={availableCities}
        />

        {/* ---- Compteur ---- */}
        <p className="text-sm text-muted-foreground">
          {filteredProfessionals.length} professionnel
          {filteredProfessionals.length > 1 ? 's' : ''}
          {hasFilters && ` (sur ${professionals.length} au total)`}
        </p>

        {/* ---- Tableau desktop ---- */}
        <ProfessionalsTable
          professionals={filteredProfessionals}
          hasFilters={hasFilters}
          isSubmitting={isSubmitting}
          formatName={formatName}
          onView={openDrawer}
          onToggleStatus={(p) => void handleToggleStatus(p)}
          onDelete={handleDeleteClick}
          visibleColumns={visibleColumns}
        />

        {/* ---- Cartes mobile ---- */}
        <ProfessionalsMobileCards
          professionals={filteredProfessionals}
          hasFilters={hasFilters}
          isSubmitting={isSubmitting}
          formatName={formatName}
          onView={openDrawer}
          onToggleStatus={(p) => void handleToggleStatus(p)}
          onDelete={handleDeleteClick}
        />

        {/* ---- Modal détail ---- */}
        <ProfessionalModal
          professional={drawerState.professional ?? null}
          isOpen={drawerState.isOpen}
          onClose={closeDrawer}
          onToggleStatus={(p) => void handleToggleStatus(p)}
          onDelete={handleDeleteClick}
          onUpdate={handleUpdate}
          isSubmitting={isSubmitting}
        />

        {/* ---- Dialog colonnes ---- */}
        <ProfessionalColumnSelectorDialog
          open={columnsDialogOpen}
          onOpenChange={setColumnsDialogOpen}
          visibleColumns={visibleColumns}
          onSave={handleSaveColumns}
          isSaving={isSavingCols}
        />

        {/* ---- Dialogue de suppression ---- */}
        <DeleteConfirmDialog
          open={professionalToDelete !== null}
          onOpenChange={handleDeleteDialogChange}
          onConfirm={() => void handleConfirmDelete()}
          title={DELETE_DIALOG.TITLE}
          description={
            professionalToDelete ? (
              <div className="space-y-2">
                <p>
                  Vous êtes sur le point de supprimer le compte de{' '}
                  <strong>{formatNameShort(professionalToDelete)}</strong>.
                </p>
                <p>
                  Cette action est irréversible et supprimera également toutes
                  ses réservations.
                </p>
              </div>
            ) : (
              ''
            )
          }
          confirmText={DELETE_DIALOG.CONFIRM_TEXT}
          cancelText={DELETE_DIALOG.CANCEL_TEXT}
          isSubmitting={isSubmitting}
          error={deleteError}
        />
      </div>
    </TooltipProvider>
  );
}
