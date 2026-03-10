/**
 * Page de gestion des spectacles - Admin
 * Orchestrateur minimal qui délègue la logique au hook et aux composants
 * S158 - Ajout tri par select
 */

'use client';

import { Suspense, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';
import type { SpectacleSortValue } from './types';

// Hook et composants locaux
import { useSpectaclesPage } from './hooks';
import {
  SpectacleFiltersBar,
  SpectacleTableView,
  SpectacleGridView,
  SpectacleMobileView,
  SpectacleModals,
} from './components';

export default function AdminSpectaclesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
          <div className="animate-pulse text-muted-foreground">
            <span className="sr-only">Chargement de la page spectacles</span>
            Chargement...
          </div>
        </div>
      }
    >
      <AdminSpectaclesContent />
    </Suspense>
  );
}

function AdminSpectaclesContent() {
  const {
    isMounted,
    isLoading,
    loadingError,
    shows,
    filteredShows,
    rawCategories,
    rawTargetAudiences,
    categoryOptions,
    targetAudiences,
    companies,
    dervisheUsers,
    hasFullAccess,
    searchQuery,
    setSearchQuery,
    hasActiveFilters,
    resetFilters,
    sortValue,
    setSortValue,
    viewMode,
    setViewMode,
    isFormDialogOpen,
    handleFormDialogOpenChange,
    editingShow,
    editingShowRaw,
    viewingShowRaw,
    showToDelete,
    deleteWarning,
    isDeleting,
    handleDeleteDialogOpenChange,
    isCategoriesDialogOpen,
    setIsCategoriesDialogOpen,
    isAudiencesDialogOpen,
    setIsAudiencesDialogOpen,
    isNewCompanyDialogOpen,
    setIsNewCompanyDialogOpen,
    newlyCreatedCompanyId,
    handleClearNewlyCreatedCompanyId,
    operationError,
    clearOperationError,
    handleRefetch,
    handleCreate,
    handleEdit,
    handleView,
    handleDeleteClick,
    handleConfirmDelete,
    handleFormSubmit,
    handleViewToEdit,
    handleViewToDelete,
    handleCloseView,
    handleDeleteFromForm,
    handleAddCategory,
    handleRemoveCategoryById,
    handleAddTargetAudience,
    handleRemoveTargetAudience,
    handleCreateCompany,
    handleCompanyCreated,
    handleNavigateToRepresentations,
    handleOpenCategoriesManager,
    handleOpenTargetAudiencesManager,
    handleOpenNewCompanyDialog,
    copiedShowId,
    copyError,
    copyLink,
    clearCopyError,
  } = useSpectaclesPage();

  const viewProps = useMemo(
    () => ({
      shows: filteredShows,
      onView: handleView,
      onEdit: handleEdit,
      onDelete: handleDeleteClick,
      onCopyLink: copyLink,
      onNavigateToRepresentations: handleNavigateToRepresentations,
      copiedShowId,
      hasFullAccess,
    }),
    [filteredShows, handleView, handleEdit, handleDeleteClick, copyLink, handleNavigateToRepresentations, copiedShowId, hasFullAccess]
  );

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
        <div className="animate-pulse text-muted-foreground">
          <span className="sr-only">Initialisation de la page</span>
          Chargement...
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
        <div className="animate-pulse text-muted-foreground">
          <span className="sr-only">Chargement des spectacles en cours</span>
          Chargement des spectacles...
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4" role="alert" aria-live="assertive">
        <AlertCircle className="w-12 h-12 text-destructive" aria-hidden="true" />
        <p className="text-destructive">Erreur: {loadingError}</p>
        <Button onClick={() => void handleRefetch()} aria-label="Réessayer le chargement des données">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Gestion des Spectacles"
        actionLabel={hasFullAccess ? 'Ajouter un spectacle' : undefined}
        onAction={hasFullAccess ? handleCreate : undefined}
      />

      {/* Message d'erreur global */}
      {operationError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3" role="alert" aria-live="assertive">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" aria-hidden="true" />
          <p className="text-sm text-destructive">{operationError}</p>
          <Button variant="ghost" size="sm" onClick={clearOperationError} className="ml-auto" aria-label="Fermer le message d'erreur">Fermer</Button>
        </div>
      )}

      {/* Message d'erreur de copie */}
      {copyError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3" role="alert" aria-live="polite">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
          <p className="text-sm text-amber-700">{copyError}</p>
          <Button variant="ghost" size="sm" onClick={clearCopyError} className="ml-auto text-amber-700 hover:text-amber-900 hover:bg-amber-100" aria-label="Fermer le message d'erreur de copie">Fermer</Button>
        </div>
      )}

      {/* Filtres + Tri */}
      <SpectacleFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={shows.length}
        filteredCount={filteredShows.length}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        sortValue={sortValue}
        onSortChange={(v: SpectacleSortValue) => setSortValue(v)}
      />

      {/* Vues */}
      {viewMode === 'list' && <SpectacleTableView {...viewProps} />}
      {viewMode === 'grid' && <SpectacleGridView {...viewProps} />}
      <SpectacleMobileView {...viewProps} />

      {/* Modales */}
      <SpectacleModals
        isFormDialogOpen={isFormDialogOpen}
        onFormDialogOpenChange={handleFormDialogOpenChange}
        editingShowRaw={editingShowRaw}
        onFormSubmit={handleFormSubmit}
        companies={companies}
        categories={categoryOptions}
        targetAudiences={targetAudiences}
        dervisheUsers={dervisheUsers}
        newlyCreatedCompanyId={newlyCreatedCompanyId}
        onClearNewlyCreatedCompanyId={handleClearNewlyCreatedCompanyId}
        onOpenCategoriesManager={handleOpenCategoriesManager}
        onOpenTargetAudiencesManager={handleOpenTargetAudiencesManager}
        onOpenNewCompanyDialog={handleOpenNewCompanyDialog}
        onDeleteFromForm={editingShow ? handleDeleteFromForm : undefined}
        viewingShowRaw={viewingShowRaw}
        rawCategories={rawCategories}
        rawTargetAudiences={rawTargetAudiences}
        onCloseView={handleCloseView}
        onViewToEdit={handleViewToEdit}
        onViewToDelete={handleViewToDelete}
        onCopyLinkFromView={copyLink}
        copiedShowId={copiedShowId}
        onNavigateToRepresentations={handleNavigateToRepresentations}
        isCategoriesDialogOpen={isCategoriesDialogOpen}
        onCategoriesDialogOpenChange={setIsCategoriesDialogOpen}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategoryById}
        isAudiencesDialogOpen={isAudiencesDialogOpen}
        onAudiencesDialogOpenChange={setIsAudiencesDialogOpen}
        onAddTargetAudience={handleAddTargetAudience}
        onRemoveTargetAudience={handleRemoveTargetAudience}
        isNewCompanyDialogOpen={isNewCompanyDialogOpen}
        onNewCompanyDialogOpenChange={setIsNewCompanyDialogOpen}
        onCreateCompany={handleCreateCompany}
        onCompanyCreated={handleCompanyCreated}
        showToDelete={showToDelete}
        deleteWarning={deleteWarning}
        isDeleting={isDeleting}
        onDeleteDialogOpenChange={handleDeleteDialogOpenChange}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
