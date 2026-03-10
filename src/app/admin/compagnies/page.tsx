/**
 * Page admin des compagnies
 * Orchestrateur simplifié après refactorisation
 * Session 107 - Refactorisation (25.97 KB → ~5 KB)
 * S158 - Ajout tri alphabétique + nb spectacles
 */

'use client';

import { AdminPageHeader, SearchInput, SortToggle, DeleteConfirmDialog } from '@/components/admin';
import {
  CompanyFormDialog,
  CompanyViewDialog,
  CreateCompanyUserDialog,
  AssignCompanyUserDialog,
} from '@/components/admin/compagnies';

import { useCompaniesPage } from './hooks';
import { CompaniesContent } from './components';

export default function AdminCompagniesPage() {
  const {
    // Données
    filteredCompanies,
    totalCount,
    companyUser,

    // Tri
    sortDir,
    toggleSortDir,

    // États de chargement
    isLoading,
    error,
    formError,
    loadingStates,

    // États des dialogs
    dialogStates,

    // Recherche
    searchQuery,
    setSearchQuery,

    // Handlers
    handlers,
    userHandlers,

    // Handlers formulaire
    handleFormDialogChange,
    handleFormSubmit,
    handleConfirmDelete,

    // Handlers view dialog
    handleViewToEdit,
    handleViewToDelete,
    closeViewDialog,

    // Handlers dialog setters
    closeDeleteDialog,
    setIsCreateUserDialogOpen,
    setIsAssignUserDialogOpen,

    // Callback utilisateur
    handleUserCreated,

    // Refresh
    refresh,
  } = useCompaniesPage();

  // État de chargement ou erreur : CompaniesContent gère l'affichage
  if (isLoading || error) {
    return (
      <CompaniesContent
        isLoading={isLoading}
        error={error}
        searchQuery={searchQuery}
        companies={filteredCompanies}
        totalCount={totalCount}
        onRefresh={refresh}
        onCreate={handlers.onCreate}
        onView={handlers.onView}
        onEdit={handlers.onEdit}
        onDelete={handlers.onDelete}
        onViewShows={handlers.onViewShows}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Gestion des Compagnies"
        actionLabel="Ajouter une compagnie"
        onAction={handlers.onCreate}
      />

      {/* Compteur */}
      <p className="text-sm text-muted-foreground">
        {filteredCompanies.length} compagnie{filteredCompanies.length > 1 ? 's' : ''}
        {searchQuery && ` (sur ${totalCount} au total)`}
      </p>

      {/* Recherche + Tri */}
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher une compagnie..."
          />
        </div>
        {/* Tri par nom A→Z / Z→A */}
        <SortToggle
          direction={sortDir}
          onToggle={toggleSortDir}
          label="Nom"
        />
      </div>

      {/* Contenu (Table desktop + Cards mobile) */}
      <CompaniesContent
        isLoading={false}
        error={null}
        searchQuery={searchQuery}
        companies={filteredCompanies}
        totalCount={totalCount}
        onRefresh={refresh}
        onCreate={handlers.onCreate}
        onView={handlers.onView}
        onEdit={handlers.onEdit}
        onDelete={handlers.onDelete}
        onViewShows={handlers.onViewShows}
      />

      {/* === DIALOGS === */}

      <CompanyFormDialog
        open={dialogStates.isFormDialogOpen}
        onOpenChange={handleFormDialogChange}
        editingCompany={dialogStates.editingCompany}
        onSubmit={handleFormSubmit}
        isSubmitting={loadingStates.isSubmitting}
        error={formError}
      />

      <CompanyViewDialog
        company={dialogStates.viewingCompany}
        onClose={closeViewDialog}
        onEdit={handleViewToEdit}
        onDelete={() => void handleViewToDelete()}
        showsCount={dialogStates.viewingCompany?.shows_count ?? 0}
        onViewShows={() =>
          dialogStates.viewingCompany &&
          handlers.onViewShows(dialogStates.viewingCompany.name)
        }
        companyUser={companyUser}
        isLoadingUser={loadingStates.isLoadingUser}
        onCreateUser={userHandlers.onCreateUser}
        onAssignUser={userHandlers.onAssignUser}
        onChangeUser={() => void userHandlers.onChangeUser()}
        onUnlinkUser={() => void userHandlers.onUnlinkUser()}
        isProcessing={loadingStates.isProcessingUser}
      />

      {/* Dialogue de création d'accès utilisateur */}
      {dialogStates.viewingCompany && (
        <CreateCompanyUserDialog
          open={dialogStates.isCreateUserDialogOpen}
          onOpenChange={setIsCreateUserDialogOpen}
          companyId={dialogStates.viewingCompany.id}
          companyName={dialogStates.viewingCompany.name}
          onSuccess={handleUserCreated}
        />
      )}

      {/* Dialogue d'assignation d'utilisateur existant */}
      {dialogStates.viewingCompany && (
        <AssignCompanyUserDialog
          open={dialogStates.isAssignUserDialogOpen}
          onOpenChange={setIsAssignUserDialogOpen}
          companyId={dialogStates.viewingCompany.id}
          companyName={dialogStates.viewingCompany.name}
          onSuccess={handleUserCreated}
        />
      )}

      <DeleteConfirmDialog
        open={!!dialogStates.companyToDelete}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
        onConfirm={() => void handleConfirmDelete()}
        title="Supprimer cette compagnie ?"
        description={
          dialogStates.deleteWarning
            ? dialogStates.deleteWarning
            : `Êtes-vous sûr de vouloir supprimer la compagnie « ${dialogStates.companyToDelete?.name} » ? Cette action est irréversible.`
        }
        confirmDisabled={!!dialogStates.deleteWarning || loadingStates.isCheckingUsage}
        isSubmitting={loadingStates.isSubmitting || loadingStates.isCheckingUsage}
      />
    </div>
  );
}
