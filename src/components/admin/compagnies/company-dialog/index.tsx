/**
 * Dialog unifié Compagnie — création et édition
 * Remplace CompanyFormDialog + CompanyViewDialog
 * S160 — Refactorisation UX (1 dialog, 2 onglets)
 *
 * Orchestrateur — sous-composants colocalisés :
 *   - InformationsForm : formulaire d'informations
 *   - AccesPlateformeSection : onglet accès plateforme
 *   - types.ts : types partagés
 *   - constants.ts : helpers et valeurs par défaut
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, KeyRound } from 'lucide-react';

import type { ActiveTab, CompanyDialogProps, CompanyFormData } from './types';
import { defaultFormData, isValidEmail, sanitizeFormData } from './constants';
import { InformationsForm } from './InformationsForm';
import { AccesPlateformeSection } from './AccesPlateformeSection';

export type { CompanyDialogProps, CompanyFormData };

export function CompanyDialog({
  open,
  onOpenChange,
  company,
  onSubmit,
  isSubmitting = false,
  error = null,
  onDelete,
  showsCount = 0,
  onViewShows,
  companyUser,
  isLoadingUser = false,
  onCreateUser,
  onAssignUser,
  onChangeUser,
  onUnlinkUser,
  isProcessing = false,
}: CompanyDialogProps) {
  const isEditing = company !== null;

  const [activeTab, setActiveTab] = useState<ActiveTab>('informations');
  const [formData, setFormData] = useState<CompanyFormData>(defaultFormData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialiser le formulaire à chaque ouverture
  useEffect(() => {
    if (open) {
      setActiveTab('informations');
      setValidationErrors({});
      if (company) {
        setFormData({
          name: company.name,
          contact_email: company.contact_email,
          description: company.description || '',
          city: company.city || '',
          contact_name: company.contact_name || '',
          contact_phone: company.contact_phone || '',
          website: company.website || '',
        });
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [open, company]);

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Le nom est obligatoire';
        break;
      case 'contact_email':
        if (!value.trim()) return "L'email est obligatoire";
        if (!isValidEmail(value)) return "Format d'email invalide (ex: contact@exemple.fr)";
        break;
    }
    return null;
  };

  const handleFieldChange = (field: keyof CompanyFormData, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'name' || field === 'contact_email') {
      const fieldError = validateField(field, value || '');
      setValidationErrors((prev) => {
        if (fieldError) return { ...prev, [field]: fieldError };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [field]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const nameError = validateField('name', formData.name);
    if (nameError) errors.name = nameError;
    const emailError = validateField('contact_email', formData.contact_email ?? '');
    if (emailError) errors.contact_email = emailError;
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    await onSubmit(sanitizeFormData(formData), isEditing);
  };

  const handleClose = () => {
    setFormData(defaultFormData);
    setValidationErrors({});
    onOpenChange(false);
  };

  const isFormValid =
    formData.name.trim() &&
    (formData.contact_email ?? '').trim() &&
    isValidEmail((formData.contact_email ?? '').trim());

  const isOnAccessTab = activeTab === 'acces';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? company.name : 'Ajouter une compagnie'}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            {isEditing && company.city ? (
              <>
                <MapPin className="w-4 h-4" />
                {company.city}
              </>
            ) : isEditing ? (
              'Modifier la compagnie'
            ) : (
              'Remplissez les informations pour créer une nouvelle compagnie.'
            )}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          /* Mode édition — 2 onglets */
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ActiveTab)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="informations">Informations</TabsTrigger>
              <TabsTrigger value="acces" className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Accès plateforme
                {!isLoadingUser && (
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${
                      companyUser ? 'bg-green-500' : 'bg-muted-foreground/40'
                    }`}
                  />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="informations" className="flex-1 overflow-y-auto mt-0">
              <InformationsForm
                formData={formData}
                validationErrors={validationErrors}
                isSubmitting={isSubmitting}
                error={error}
                onFieldChange={handleFieldChange}
              />
            </TabsContent>

            <TabsContent value="acces" className="flex-1 overflow-y-auto mt-0">
              <AccesPlateformeSection
                company={company}
                showsCount={showsCount}
                onViewShows={onViewShows}
                companyUser={companyUser}
                isLoadingUser={isLoadingUser}
                onCreateUser={onCreateUser}
                onAssignUser={onAssignUser}
                onChangeUser={onChangeUser}
                onUnlinkUser={onUnlinkUser}
                isProcessing={isProcessing}
              />
            </TabsContent>
          </Tabs>
        ) : (
          /* Mode création — formulaire seul */
          <div className="flex-1 overflow-y-auto">
            <InformationsForm
              formData={formData}
              validationErrors={validationErrors}
              isSubmitting={isSubmitting}
              error={error}
              onFieldChange={handleFieldChange}
            />
          </div>
        )}

        <DialogFooter className="border-t pt-4 mt-2 flex flex-col sm:flex-row gap-2">
          {/* Suppression — édition uniquement, gauche */}
          {isEditing && onDelete && (
            <Button
              variant="outline"
              onClick={onDelete}
              disabled={isSubmitting || isProcessing}
              className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Supprimer
            </Button>
          )}

          <div className="flex-1" />

          {/* Annuler / Fermer */}
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isOnAccessTab ? 'Fermer' : 'Annuler'}
          </Button>

          {/* Sauvegarder — masqué sur l'onglet accès */}
          {!isOnAccessTab && (
            <Button
              onClick={() => void handleSubmit()}
              disabled={!isFormValid || isSubmitting}
              className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
            >
              {isSubmitting
                ? 'Enregistrement...'
                : isEditing
                  ? 'Modifier'
                  : 'Créer'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
