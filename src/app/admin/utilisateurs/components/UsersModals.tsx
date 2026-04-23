/**
 * Composant UsersModals - Wrapper des modales utilisateurs
 * Derviche Diffusion
 */

import { DeleteConfirmDialog } from '@/components/admin';
import { 
  UserViewDialog, 
  UserFormDialog,
} from '@/components/admin/utilisateurs';

import type { UsersModalsProps } from '../types';
import { MESSAGES } from '../constants';

export function UsersModals({
  // Formatage
  formatName,
  // Viewer (pour filtrer les rôles dans le dropdown)
  currentUserRole,
  // Form Dialog
  isFormDialogOpen,
  onFormDialogChange,
  editingUser,
  onFormSubmit,
  onCreateUser,
  isSubmitting,
  formError,
  // View Dialog
  viewingUser,
  onCloseView,
  onViewToEdit,
  onViewToDelete,
  canDeleteViewing,
  canEditViewing,
  // Delete Dialog
  userToDelete,
  onDeleteDialogChange,
  onConfirmDelete,
  deleteError,
  canDeleteUser,
}: UsersModalsProps) {
  return (
    <>
      {/* Formulaire création/édition */}
      <UserFormDialog
        open={isFormDialogOpen}
        onOpenChange={onFormDialogChange}
        editingUser={editingUser}
        onSubmit={onFormSubmit}
        onCreate={onCreateUser}
        isSubmitting={isSubmitting}
        error={formError}
        viewerRole={currentUserRole}
      />

      {/* Vue détaillée */}
      <UserViewDialog
        user={viewingUser}
        onClose={onCloseView}
        onEdit={onViewToEdit}
        onDelete={onViewToDelete}
        canDelete={canDeleteViewing}
        canEdit={canEditViewing}
      />

      {/* Confirmation de suppression */}
      <DeleteConfirmDialog
        open={!!userToDelete}
        onOpenChange={onDeleteDialogChange}
        onConfirm={() => void onConfirmDelete()}
        title={MESSAGES.DELETE_CONFIRM_TITLE}
        description={`Êtes-vous sûr de vouloir supprimer le compte de « ${userToDelete ? formatName(userToDelete) : ''} » (${userToDelete?.email}) ? Cette action est irréversible.`}
        confirmText="Supprimer"
        isSubmitting={isSubmitting}
        error={deleteError}
        confirmDisabled={userToDelete ? !canDeleteUser(userToDelete) : false}
      />
    </>
  );
}
