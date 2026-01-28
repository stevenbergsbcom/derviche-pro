/**
 * UserFormDialog - Dialog de création/édition d'utilisateur
 * Derviche Diffusion - Session 102
 *
 * Orchestrateur qui délègue la logique au hook et l'UI aux composants
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Types
import type { UserFormDialogProps } from './types';

// Hook
import { useUserFormDialog } from './hooks';

// Composants
import {
  EmailField,
  PasswordField,
  MustChangePasswordField,
  PersonalInfoFields,
  RoleSelector,
  CompanySelector,
  FormError,
} from './components';

// Constantes
import { HELP_MESSAGES } from './constants';

/**
 * Modale de création/édition d'un utilisateur (interne ou compagnie)
 */
export function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
  onSubmit,
  onCreate,
  isSubmitting = false,
  error = null,
}: UserFormDialogProps) {
  // Hook pour gérer toute la logique
  const {
    isCreating,
    formData,
    showPassword,
    copied,
    validationErrors,
    companies,
    isLoadingCompanies,
    passwordStrength,
    isValid,
    isEditingCompanyUser,
    canSelectCompany,
    handleFieldChange,
    handleRoleChange,
    handleCompanyChange,
    handleGeneratePassword,
    handleCopyPassword,
    toggleShowPassword,
    handleSubmit,
    handleClose,
  } = useUserFormDialog({
    open,
    editingUser,
    onSubmit,
    onCreate,
    onOpenChange,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else onOpenChange(isOpen);
      }}
    >
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>
            {isCreating ? 'Ajouter un utilisateur' : "Modifier l'utilisateur"}
          </DialogTitle>
          <DialogDescription>
            {isCreating
              ? 'Créez un nouveau compte utilisateur.'
              : `Modifiez les informations de ${editingUser?.email}`}
          </DialogDescription>
        </DialogHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          {/* Message d'erreur serveur */}
          <FormError error={error} />

          {/* Email */}
          <EmailField
            isCreating={isCreating}
            email={formData.email}
            editingUserEmail={editingUser?.email}
            onChange={(value) => handleFieldChange('email', value)}
            validationError={validationErrors.email}
            isSubmitting={isSubmitting}
          />

          {/* Mot de passe (création uniquement) */}
          {isCreating && (
            <>
              <PasswordField
                password={formData.password}
                onChange={(value) => handleFieldChange('password', value)}
                onGenerate={handleGeneratePassword}
                onCopy={handleCopyPassword}
                showPassword={showPassword}
                onToggleVisibility={toggleShowPassword}
                copied={copied}
                passwordStrength={passwordStrength}
                validationError={validationErrors.password}
                isSubmitting={isSubmitting}
              />

              <MustChangePasswordField
                checked={formData.must_change_password}
                onChange={(checked) => handleFieldChange('must_change_password', checked)}
                isSubmitting={isSubmitting}
              />
            </>
          )}

          {/* Informations personnelles */}
          <PersonalInfoFields
            firstName={formData.first_name}
            lastName={formData.last_name}
            phone={formData.phone}
            onFirstNameChange={(value) => handleFieldChange('first_name', value)}
            onLastNameChange={(value) => handleFieldChange('last_name', value)}
            onPhoneChange={(value) => handleFieldChange('phone', value)}
            isSubmitting={isSubmitting}
          />

          {/* Sélecteur de rôle */}
          <RoleSelector
            role={formData.role}
            onChange={handleRoleChange}
            disabled={isSubmitting || isEditingCompanyUser}
            warningMessage={
              isEditingCompanyUser ? HELP_MESSAGES.companyRoleWarning : undefined
            }
          />

          {/* Sélecteur de compagnie (si rôle = company) */}
          {formData.role === 'company' && (
            <CompanySelector
              companyId={formData.company_id}
              companies={companies}
              onChange={handleCompanyChange}
              isLoading={isLoadingCompanies}
              disabled={isSubmitting || !canSelectCompany}
              validationError={validationErrors.company_id}
              isCreating={isCreating}
              isEditingCompanyUser={isEditingCompanyUser}
            />
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={!isValid || isSubmitting}
            className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
          >
            {isSubmitting
              ? 'Enregistrement...'
              : isCreating
              ? 'Créer'
              : 'Modifier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Réexporter les types pour compatibilité
export type { UserFormData, CreateUserFormData, UserFormDialogProps } from './types';
