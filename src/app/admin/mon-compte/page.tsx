'use client';

import { AdminPageHeader } from '@/components/admin';
import {
  MonCompteSkeleton,
  PersonalInfoCard,
  AccountInfoCard,
  SecurityCard,
  PasswordDialog,
} from './components';
import { useMonCompte } from './hooks/useMonCompte';

export default function AdminMonComptePage() {
  const {
    isLoading,
    isSaving,
    isChangingPassword,
    userData,
    isEditing,
    isPasswordDialogOpen,
    formData,
    passwordData,
    passwordError,
    setFormData,
    setIsEditing,
    handleSaveProfile,
    handleCancelEdit,
    setIsPasswordDialogOpen,
    setPasswordData,
    handleChangePassword,
    handleCancelPassword,
  } = useMonCompte();

  if (isLoading) return <MonCompteSkeleton />;

  if (!userData) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Mon compte" />
        <p className="text-muted-foreground">Impossible de charger vos informations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Mon compte" />

      <div className="grid gap-6 lg:grid-cols-2">
        <PersonalInfoCard
          userData={userData}
          formData={formData}
          isEditing={isEditing}
          isSaving={isSaving}
          onFormDataChange={setFormData}
          onStartEdit={() => setIsEditing(true)}
          onCancelEdit={handleCancelEdit}
          onSave={() => void handleSaveProfile()}
        />

        <AccountInfoCard userData={userData} />

        <SecurityCard onOpenPasswordDialog={() => setIsPasswordDialogOpen(true)} />
      </div>

      <PasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        passwordData={passwordData}
        onPasswordDataChange={setPasswordData}
        passwordError={passwordError}
        isChangingPassword={isChangingPassword}
        onSubmit={() => void handleChangePassword()}
        onCancel={handleCancelPassword}
      />
    </div>
  );
}
