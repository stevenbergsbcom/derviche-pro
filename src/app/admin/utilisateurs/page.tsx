/**
 * Page Admin Utilisateurs - Orchestrateur
 * Derviche Diffusion
 * 
 * Gestion des utilisateurs internes (super-admin, admin, externe) et compagnies.
 * Refactorisé en structure modulaire (Session 99).
 */

'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { AdminPageHeader, LoadingState, ErrorState } from '@/components/admin';

import { useUtilisateursPage } from './hooks';
import {
  RoleSummaryBadges,
  UsersFilters,
  UsersTable,
  UsersMobileCards,
  UsersModals,
} from './components';
import { MESSAGES, LABELS } from './constants';

export default function AdminUtilisateursPage() {
  const {
    // Données
    users,
    filteredUsers,
    roleCounts,
    isLoading,
    error,
    
    // Utilisateur courant
    currentUserId,
    currentUserRole,
    
    // Filtres
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    hasFilters,
    
    // États
    isSubmitting,
    formError,
    deleteError,
    
    // Modales
    isFormDialogOpen,
    editingUser,
    userToDelete,
    viewingUser,
    
    // Handlers
    refresh,
    handleCreate,
    handleEdit,
    handleView,
    handleCloseView,
    handleDeleteClick,
    handleConfirmDelete,
    handleViewToEdit,
    handleViewToDelete,
    handleFormDialogChange,
    handleDeleteDialogChange,
    handleCreateUser,
    handleFormSubmit,
    handleToggleStatus,
    
    // Permissions
    canDeleteUser,
    canToggleStatus,
    
    // Formatage
    formatName,
  } = useUtilisateursPage();

  // État de chargement initial
  if (isLoading) {
    return <LoadingState message={MESSAGES.LOADING} />;
  }

  // Erreur de chargement
  if (error) {
    return (
      <ErrorState 
        message={`${MESSAGES.ERROR_PREFIX}${error}`}
        onRetry={() => void refresh()}
      >
        <AdminPageHeader
          title={LABELS.PAGE_TITLE}
          actionLabel={LABELS.ADD_USER}
          onAction={handleCreate}
        />
      </ErrorState>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <AdminPageHeader
          title={LABELS.PAGE_TITLE}
          actionLabel={LABELS.ADD_USER}
          onAction={handleCreate}
        />

        {/* Résumé par rôle */}
        <RoleSummaryBadges counts={roleCounts} />

        {/* Filtres */}
        <UsersFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
        />

        {/* Compteur */}
        <p className="text-sm text-muted-foreground">
          {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
          {hasFilters && ` (sur ${users.length} au total)`}
        </p>

        {/* Tableau desktop */}
        <UsersTable
          users={filteredUsers}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          isSubmitting={isSubmitting}
          hasFilters={hasFilters}
          formatName={formatName}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
          canDelete={canDeleteUser}
          canToggleStatus={canToggleStatus}
        />

        {/* Cartes mobile */}
        <UsersMobileCards
          users={filteredUsers}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          isSubmitting={isSubmitting}
          hasFilters={hasFilters}
          formatName={formatName}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
          canDelete={canDeleteUser}
          canToggleStatus={canToggleStatus}
        />

        {/* Modales */}
        <UsersModals
          formatName={formatName}
          isFormDialogOpen={isFormDialogOpen}
          onFormDialogChange={handleFormDialogChange}
          editingUser={editingUser}
          onFormSubmit={handleFormSubmit}
          onCreateUser={handleCreateUser}
          isSubmitting={isSubmitting}
          formError={formError}
          viewingUser={viewingUser}
          onCloseView={handleCloseView}
          onViewToEdit={handleViewToEdit}
          onViewToDelete={handleViewToDelete}
          canDeleteViewing={viewingUser ? canDeleteUser(viewingUser) : true}
          userToDelete={userToDelete}
          onDeleteDialogChange={handleDeleteDialogChange}
          onConfirmDelete={handleConfirmDelete}
          deleteError={deleteError}
          canDeleteUser={canDeleteUser}
        />
      </div>
    </TooltipProvider>
  );
}
