/**
 * Page de gestion des spectacles - Admin
 * Orchestrateur minimal qui délègue la logique au hook et aux composants
 */

'use client';

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';

// Hook et composants locaux
import { useSpectaclesPage } from './hooks';
import {
  SpectacleFiltersBar,
  SpectacleTableView,
  SpectacleGridView,
  SpectacleMobileView,
  SpectacleModals,
} from './components';

// ============================================================================
// Composant wrapper avec Suspense
// ============================================================================

export default function AdminSpectaclesPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center min-h-[400px]"
          role="status"
          aria-live="polite"
        >
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

// ============================================================================
// Composant principal
// ============================================================================

function AdminSpectaclesContent() {
  const {
    // États de chargement
    isMounted,
    isLoading,
    loadingError,

    // Données
    shows,
    filteredShows,
    rawCategories,
    rawTargetAudiences,
    categoryOptions,
    targetAudiences,
    companies,
    dervisheUsers,

    // Permissions
    hasFullAccess,

    // Recherche et filtres
    searchQuery,
    setSearchQuery,
    hasActiveFilters,
    resetFilters,

    // Mode d'affichage
    viewMode,
    setViewMode,

    // États modales
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

    // Erreurs
    operationError,
    clearOperationError,

    // Refetch
    handleRefetch,

    // Handlers CRUD
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

    // Handlers catégories
    handleAddCategory,
    handleRemoveCategoryById,

    // Handlers publics cibles
    handleAddTargetAudience,
    handleRemoveTargetAudience,

    // Handlers compagnies
    handleCreateCompany,
    handleCompanyCreated,

    // Navigation
    handleNavigateToRepresentations,

    // Handlers stables pour modales
    handleOpenCategoriesManager,
    handleOpenTargetAudiencesManager,
    handleOpenNewCompanyDialog,

    // Copie de lien
    copiedShowId,
    copyError,
    copyLink,
    clearCopyError,
  } = useSpectaclesPage();

  // ============================================================================
  // États de chargement et erreurs
  // ============================================================================

  if (!isMounted) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px]"
        role="status"
        aria-live="polite"
      >
        <div className="animate-pulse text-muted-foreground">
          <span className="sr-only">Initialisation de la page</span>
          Chargement...
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px]"
        role="status"
        aria-live="polite"
      >
        <div className="animate-pulse text-muted-foreground">
          <span className="sr-only">Chargement des spectacles en cours</span>
          Chargement des spectacles...
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[400px] gap-4"
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle className="w-12 h-12 text-destructive" aria-hidden="true" />
        <p className="text-destructive">Erreur: {loadingError}</p>
        <Button
          onClick={() => void handleRefetch()}
          aria-label="Réessayer le chargement des données"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  // ============================================================================
  // Props communes pour les vues
  // ============================================================================

  const viewProps = {
    shows: filteredShows,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    onCopyLink: copyLink,
    onNavigateToRepresentations: handleNavigateToRepresentations,
    copiedShowId,
    hasFullAccess,
  };

  // ============================================================================
  // Rendu
  // ============================================================================

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
        <div
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" aria-hidden="true" />
          <p className="text-sm text-destructive">{operationError}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearOperationError}
            className="ml-auto"
            aria-label="Fermer le message d'erreur"
          >
            Fermer
          </Button>
        </div>
      )}

      {/* Message d'erreur de copie */}
      {copyError && (
        <div
          className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
          <p className="text-sm text-amber-700">{copyError}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCopyError}
            className="ml-auto text-amber-700 hover:text-amber-900 hover:bg-amber-100"
            aria-label="Fermer le message d'erreur de copie"
          >
            Fermer
          </Button>
        </div>
      )}

      {/* Filtres */}
      <SpectacleFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={shows.length}
        filteredCount={filteredShows.length}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      {/* Vues */}
      {viewMode === 'list' && <SpectacleTableView {...viewProps} />}
      {viewMode === 'grid' && <SpectacleGridView {...viewProps} />}
      <SpectacleMobileView {...viewProps} />

      {/* Modales */}
      <SpectacleModals
        // Form dialog
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
        // View dialog
        viewingShowRaw={viewingShowRaw}
        rawCategories={rawCategories}
        rawTargetAudiences={rawTargetAudiences}
        onCloseView={handleCloseView}
        onViewToEdit={handleViewToEdit}
        onViewToDelete={handleViewToDelete}
        onCopyLinkFromView={copyLink}
        copiedShowId={copiedShowId}
        onNavigateToRepresentations={handleNavigateToRepresentations}
        // Category manager
        isCategoriesDialogOpen={isCategoriesDialogOpen}
        onCategoriesDialogOpenChange={setIsCategoriesDialogOpen}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategoryById}
        // Target audience manager
        isAudiencesDialogOpen={isAudiencesDialogOpen}
        onAudiencesDialogOpenChange={setIsAudiencesDialogOpen}
        onAddTargetAudience={handleAddTargetAudience}
        onRemoveTargetAudience={handleRemoveTargetAudience}
        // Company quick create
        isNewCompanyDialogOpen={isNewCompanyDialogOpen}
        onNewCompanyDialogOpenChange={setIsNewCompanyDialogOpen}
        onCreateCompany={handleCreateCompany}
        onCompanyCreated={handleCompanyCreated}
        // Delete confirm
        showToDelete={showToDelete}
        deleteWarning={deleteWarning}
        isDeleting={isDeleting}
        onDeleteDialogOpenChange={handleDeleteDialogOpenChange}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
