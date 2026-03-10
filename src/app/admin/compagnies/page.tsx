/**
 * Page admin des compagnies
 * S160 — Dialog unifié (CompanyDialog remplace CompanyFormDialog + CompanyViewDialog)
 */

'use client';

import { AdminPageHeader, SearchInput, SortToggle, DeleteConfirmDialog } from '@/components/admin';
import {
  CompanyDialog,
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

    // Handlers dialog
    handleDialogChange,
    handleFormSubmit,
    handleDeleteFromDialog,
    handleConfirmDelete,
    closeDeleteDialog,
    handleConfirmUnlink,
    setIsUnlinkConfirmOpen,

    // Setters dialogs secondaires
    setIsCreateUserDialogOpen,
    setIsAssignUserDialogOpen,

    // Callback utilisateur
    handleUserCreated,

    // Refresh
    refresh,
  } = useCompaniesPage();

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
        onEdit={handlers.onEdit}
        onDelete={handlers.onDelete}
        onViewShows={handlers.onViewShows}
      />

      {/* === DIALOG UNIFIÉ === */}
      <CompanyDialog
        open={dialogStates.isDialogOpen}
        onOpenChange={handleDialogChange}
        company={dialogStates.selectedCompany}
        onSubmit={handleFormSubmit}
        isSubmitting={loadingStates.isSubmitting}
        error={formError}
        onDelete={() => void handleDeleteFromDialog()}
        showsCount={dialogStates.selectedCompany?.shows_count ?? 0}
        onViewShows={
          dialogStates.selectedCompany
            ? () => handlers.onViewShows(dialogStates.selectedCompany!.name)
            : undefined
        }
        companyUser={companyUser}
        isLoadingUser={loadingStates.isLoadingUser}
        onCreateUser={userHandlers.onCreateUser}
        onAssignUser={userHandlers.onAssignUser}
        onChangeUser={() => userHandlers.onChangeUser()}
        onUnlinkUser={() => void userHandlers.onUnlinkUser()}
        isProcessing={loadingStates.isProcessingUser}
      />

      {/* Dialogue de création d'accès utilisateur */}
      {dialogStates.selectedCompany && (
        <CreateCompanyUserDialog
          open={dialogStates.isCreateUserDialogOpen}
          onOpenChange={setIsCreateUserDialogOpen}
          companyId={dialogStates.selectedCompany.id}
          companyName={dialogStates.selectedCompany.name}
          onSuccess={handleUserCreated}
        />
      )}

      {/* Dialogue d'assignation d'utilisateur existant */}
      {dialogStates.selectedCompany && (
        <AssignCompanyUserDialog
          open={dialogStates.isAssignUserDialogOpen}
          onOpenChange={setIsAssignUserDialogOpen}
          companyId={dialogStates.selectedCompany.id}
          companyName={dialogStates.selectedCompany.name}
          onSuccess={handleUserCreated}
        />
      )}

      {/* Dialogue de confirmation de dissociation utilisateur */}
      <DeleteConfirmDialog
        open={dialogStates.isUnlinkConfirmOpen}
        onOpenChange={(open) => { if (!open) setIsUnlinkConfirmOpen(false); }}
        onConfirm={() => void handleConfirmUnlink()}
        title="Retirer l'accès ?"
        description={
          <span>
            L&apos;accès de{' '}
            <strong className="text-foreground">{companyUser?.email}</strong>{' '}
            à cette compagnie sera supprimé. La compagnie ne pourra plus se connecter à la plateforme.
          </span>
        }
        confirmText="Retirer l'accès"
        cancelText="Annuler"
      />

      {/* Dialogue de confirmation de suppression */}
      <DeleteConfirmDialog
        open={!!dialogStates.companyToDelete}
        onOpenChange={(open) => { if (!open) closeDeleteDialog(); }}
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
