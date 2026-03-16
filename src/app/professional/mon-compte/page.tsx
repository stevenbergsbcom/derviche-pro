'use client';

import { Button } from '@/components/ui/button';

import {
  MonCompteSkeleton,
  PersonalSection,
  ProfessionalSection,
  AddressSection,
  SecuritySection,
  PasswordDialog,
  DeleteAccountDialog,
  DangerZoneSection,
} from './components';
import { useMonCompteProfile, useMonCompteActions } from './hooks';

// ============================================
// PAGE
// ============================================

export default function ProfessionalMonComptePage() {
  const {
    isLoading,
    loadError,
    isSaving,
    profile,
    editingSection,
    formData,
    loadProfile,
    handleFormChange,
    handleSave,
    handleCancelEdit,
    setEditingSection,
  } = useMonCompteProfile();

  const {
    isPasswordDialogOpen,
    setIsPasswordDialogOpen,
    isChangingPassword,
    passwordError,
    passwordData,
    handlePasswordDataChange,
    handleClosePasswordDialog,
    handleChangePassword,
    isDeleteDialogOpen,
    deleteStep,
    deleteConfirmText,
    setDeleteConfirmText,
    deleteError,
    setDeleteError,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleDeleteAccount,
  } = useMonCompteActions();

  // ----------------------------------------
  // États de chargement et d'erreur
  // ----------------------------------------

  if (isLoading) return <MonCompteSkeleton />;

  if (loadError || (!isLoading && !profile)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-derviche-dark">Mon compte</h1>
        <p className="text-muted-foreground">Impossible de charger vos informations.</p>
        <Button variant="outline" onClick={() => void loadProfile()}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!profile) return null;

  // ----------------------------------------
  // Props partagées des sections éditables
  // ----------------------------------------

  const sectionProps = {
    profile,
    formData,
    editingSection,
    isSaving,
    onFormChange: handleFormChange,
    onEdit: setEditingSection,
    onSave: handleSave,
    onCancelEdit: handleCancelEdit,
  };

  // ----------------------------------------
  // Rendu
  // ----------------------------------------

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-derviche-dark">Mon compte</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et professionnelles
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PersonalSection {...sectionProps} />
        <ProfessionalSection {...sectionProps} />
        <AddressSection {...sectionProps} />
        <SecuritySection
          profile={profile}
          onOpenPasswordDialog={() => setIsPasswordDialogOpen(true)}
        />
      </div>

      {/* Zone dangereuse */}
      <DangerZoneSection onOpenDeleteDialog={handleOpenDeleteDialog} />

      {/* Dialogs */}
      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={handleClosePasswordDialog}
        passwordData={passwordData}
        onPasswordDataChange={handlePasswordDataChange}
        passwordError={passwordError}
        isChangingPassword={isChangingPassword}
        onSubmit={() => void handleChangePassword()}
      />

      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        deleteStep={deleteStep}
        deleteConfirmText={deleteConfirmText}
        onConfirmTextChange={setDeleteConfirmText}
        deleteError={deleteError}
        onDeleteError={setDeleteError}
        onDelete={() => void handleDeleteAccount()}
      />
    </div>
  );
}
