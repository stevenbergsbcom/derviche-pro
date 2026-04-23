/**
 * Page Mon compte — Espace Compagnie
 * Derviche Diffusion — S198
 *
 * Structure calquée sur `src/app/admin/mon-compte/page.tsx` :
 *  - Informations personnelles (nom, prénom, téléphone) en mode lecture/édition
 *  - Compte et accès (email en lecture seule, rôle, date d'inscription)
 *  - Sécurité (changement de mot de passe via dialog)
 */

'use client';

import { User } from 'lucide-react';
import {
  MonCompteSkeleton,
  PersonalInfoCard,
  AccountInfoCard,
  SecurityCard,
  PasswordDialog,
} from './components';
import { useMonCompte } from './hooks/useMonCompte';

export default function CompanyMonComptePage() {
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
        <div>
          <h1 className="text-2xl font-bold text-derviche-dark flex items-center gap-2">
            <User className="w-7 h-7 text-gold" />
            Mon compte
          </h1>
        </div>
        <p className="text-muted-foreground">Impossible de charger vos informations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header — style aligné sur les autres pages company (Film / Ticket / etc.) */}
      <div>
        <h1 className="text-2xl font-bold text-derviche-dark flex items-center gap-2">
          <User className="w-7 h-7 text-gold" />
          Mon compte
        </h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles</p>
      </div>

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
