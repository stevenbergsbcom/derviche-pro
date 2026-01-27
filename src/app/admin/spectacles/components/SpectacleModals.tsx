/**
 * Wrapper pour toutes les modales de la page spectacles
 */

'use client';

import { DeleteConfirmDialog } from '@/components/admin';
import {
  SpectacleFormDialog,
  SpectacleViewDialog,
  CategoryManagerDialog,
  TargetAudienceManagerDialog,
  CompanyQuickCreateDialog,
} from '@/components/admin/spectacles';
import type { SpectacleModalsProps } from '../types';

export function SpectacleModals({
  // Form dialog
  isFormDialogOpen,
  onFormDialogOpenChange,
  editingShowRaw,
  onFormSubmit,
  companies,
  categories,
  targetAudiences,
  dervisheUsers,
  newlyCreatedCompanyId,
  onClearNewlyCreatedCompanyId,
  onOpenCategoriesManager,
  onOpenTargetAudiencesManager,
  onOpenNewCompanyDialog,
  onDeleteFromForm,

  // View dialog
  viewingShowRaw,
  rawCategories,
  rawTargetAudiences,
  onCloseView,
  onViewToEdit,
  onViewToDelete,
  onCopyLinkFromView,
  copiedShowId,
  onNavigateToRepresentations,

  // Category manager
  isCategoriesDialogOpen,
  onCategoriesDialogOpenChange,
  onAddCategory,
  onRemoveCategory,

  // Target audience manager
  isAudiencesDialogOpen,
  onAudiencesDialogOpenChange,
  onAddTargetAudience,
  onRemoveTargetAudience,

  // Company quick create
  isNewCompanyDialogOpen,
  onNewCompanyDialogOpenChange,
  onCreateCompany,
  onCompanyCreated,

  // Delete confirm
  showToDelete,
  deleteWarning,
  isDeleting,
  onDeleteDialogOpenChange,
  onConfirmDelete,
}: SpectacleModalsProps) {
  return (
    <>
      {/* Modale création/édition de spectacle */}
      <SpectacleFormDialog
        open={isFormDialogOpen}
        onOpenChange={onFormDialogOpenChange}
        editingShow={editingShowRaw}
        onSubmit={(data, isEditing) => onFormSubmit(data, isEditing)}
        companies={companies}
        categories={categories}
        targetAudiences={targetAudiences}
        dervisheUsers={dervisheUsers}
        onOpenCategoriesManager={onOpenCategoriesManager}
        onOpenTargetAudiencesManager={onOpenTargetAudiencesManager}
        onOpenNewCompanyDialog={onOpenNewCompanyDialog}
        newlyCreatedCompanyId={newlyCreatedCompanyId}
        onClearNewlyCreatedCompanyId={onClearNewlyCreatedCompanyId}
        onDelete={onDeleteFromForm}
      />

      {/* Modale de visualisation */}
      <SpectacleViewDialog
        show={viewingShowRaw}
        categories={rawCategories}
        targetAudiences={rawTargetAudiences}
        onClose={onCloseView}
        onEdit={onViewToEdit}
        onDelete={onViewToDelete}
        onCopyLink={onCopyLinkFromView}
        copiedShowId={copiedShowId}
        onNavigateToRepresentations={onNavigateToRepresentations}
        dervisheUsers={dervisheUsers}
      />

      {/* Modale de gestion des catégories */}
      <CategoryManagerDialog
        open={isCategoriesDialogOpen}
        onOpenChange={onCategoriesDialogOpenChange}
        categories={rawCategories}
        onAddCategory={(name) => onAddCategory(name)}
        onRemoveCategory={(id) => onRemoveCategory(id)}
      />

      {/* Modale de gestion des publics cibles */}
      <TargetAudienceManagerDialog
        open={isAudiencesDialogOpen}
        onOpenChange={onAudiencesDialogOpenChange}
        targetAudiences={targetAudiences}
        onAddTargetAudience={(name) => onAddTargetAudience(name)}
        onRemoveTargetAudience={(id) => onRemoveTargetAudience(id)}
      />

      {/* Modale création de compagnie */}
      <CompanyQuickCreateDialog
        open={isNewCompanyDialogOpen}
        onOpenChange={onNewCompanyDialogOpenChange}
        onCreateCompany={(data) => onCreateCompany(data)}
        onCompanyCreated={onCompanyCreated}
      />

      {/* Modale de confirmation de suppression */}
      <DeleteConfirmDialog
        open={showToDelete !== null}
        onOpenChange={onDeleteDialogOpenChange}
        onConfirm={() => void onConfirmDelete()}
        title="Supprimer ce spectacle ?"
        description={
          deleteWarning
            ? `${deleteWarning} Êtes-vous sûr de vouloir supprimer le spectacle « ${showToDelete?.title} » ?`
            : `Êtes-vous sûr de vouloir supprimer le spectacle « ${showToDelete?.title} » ? Cette action est irréversible.`
        }
        isSubmitting={isDeleting}
      />
    </>
  );
}
