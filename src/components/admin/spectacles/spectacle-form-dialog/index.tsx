/**
 * SpectacleFormDialog - Dialog de création/édition de spectacle
 * Derviche Diffusion - Session 101
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
import { Maximize2, Minimize2, Trash2 } from 'lucide-react';

// Types
import type { SpectacleFormDialogProps } from './types';

// Hook
import { useSpectacleForm } from './hooks';

// Composants
import {
  BasicInfoSection,
  CategoriesSection,
  TargetAudiencesSection,
  SettingsSection,
  DescriptionsSection,
  ManagementSection,
  MediaSection,
  FormError,
} from './components';

/**
 * Modale de création/édition d'un spectacle
 */
export function SpectacleFormDialog({
  open,
  onOpenChange,
  editingShow,
  onSubmit,
  companies,
  categories,
  targetAudiences,
  dervisheUsers,
  onOpenCategoriesManager,
  onOpenTargetAudiencesManager,
  onOpenNewCompanyDialog,
  newlyCreatedCompanyId,
  onClearNewlyCreatedCompanyId,
  onDelete,
}: SpectacleFormDialogProps) {
  // Hook pour gérer toute la logique
  const {
    formData,
    isExpanded,
    isSubmitting,
    error,
    setIsExpanded,
    setError,
    updateField,
    handleCategoryChange,
    handleTargetAudienceChange,
    handleImageChange,
    handleSubmit,
    handleClose,
    resetForm,
  } = useSpectacleForm({
    open,
    editingShow,
    onSubmit,
    onOpenChange,
    newlyCreatedCompanyId,
    onClearNewlyCreatedCompanyId,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm();
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent
        className={`w-full max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden flex flex-col transition-all duration-200 ${
          isExpanded ? 'sm:max-w-6xl sm:h-[90vh]' : 'sm:max-w-3xl'
        }`}
      >
        {/* Header */}
        <DialogHeader className="relative">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>
                {editingShow ? 'Modifier le spectacle' : 'Ajouter un spectacle'}
              </DialogTitle>
              <DialogDescription>
                {editingShow
                  ? 'Modifiez les informations du spectacle ci-dessous.'
                  : 'Remplissez les informations pour créer un nouveau spectacle.'}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-8 w-8 shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Réduire' : 'Agrandir'}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="w-4 h-4" aria-hidden="true" />
              )}
              <span className="sr-only">{isExpanded ? 'Réduire' : 'Agrandir'}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Formulaire */}
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Message d'erreur */}
          <FormError error={error} onClose={() => setError(null)} />

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-4">
              {/* Section: Informations de base */}
              <BasicInfoSection
                title={formData.title}
                slug={formData.slug}
                companyId={formData.companyId}
                companies={companies}
                onTitleChange={(value) => updateField('title', value)}
                onCompanyChange={(value) => updateField('companyId', value)}
                onOpenNewCompanyDialog={onOpenNewCompanyDialog}
              />

              {/* Section: Catégories */}
              <CategoriesSection
                categoryIds={formData.categoryIds}
                categories={categories}
                onCategoryChange={handleCategoryChange}
                onOpenCategoriesManager={onOpenCategoriesManager}
              />

              {/* Section: Publics cibles */}
              <TargetAudiencesSection
                targetAudienceIds={formData.targetAudienceIds}
                targetAudiences={targetAudiences}
                onTargetAudienceChange={handleTargetAudienceChange}
                onOpenTargetAudiencesManager={onOpenTargetAudiencesManager}
              />

              {/* Section: Paramètres */}
              <SettingsSection
                status={formData.status}
                duration={formData.duration}
                period={formData.period}
                closureDates={formData.closureDates}
                onStatusChange={(value) => updateField('status', value)}
                onDurationChange={(value) => updateField('duration', value)}
                onPeriodChange={(value) => updateField('period', value)}
                onClosureDatesChange={(value) => updateField('closureDates', value)}
              />

              {/* Section: Descriptions */}
              <DescriptionsSection
                description={formData.description}
                invitationPolicy={formData.invitationPolicy}
                maxParticipantsPerBooking={formData.maxParticipantsPerBooking}
                onDescriptionChange={(value) => updateField('description', value)}
                onInvitationPolicyChange={(value) => updateField('invitationPolicy', value)}
                onMaxParticipantsChange={(value) =>
                  updateField('maxParticipantsPerBooking', value)
                }
              />

              {/* Section: Gestion */}
              <ManagementSection
                dervisheManagerId={formData.dervisheManagerId}
                dervisheUsers={dervisheUsers}
                onDervisheManagerChange={(value) => updateField('dervisheManagerId', value)}
              />

              {/* Section: Médias */}
              <MediaSection
                folderUrl={formData.folderUrl}
                teaserUrl={formData.teaserUrl}
                captationAvailable={formData.captationAvailable}
                captationUrl={formData.captationUrl}
                photoFolderUrl={formData.photoFolderUrl}
                imageUrl={formData.imageUrl}
                isSubmitting={isSubmitting}
                onFolderUrlChange={(value) => updateField('folderUrl', value)}
                onTeaserUrlChange={(value) => updateField('teaserUrl', value)}
                onCaptationAvailableChange={(value) => updateField('captationAvailable', value)}
                onCaptationUrlChange={(value) => updateField('captationUrl', value)}
                onPhotoFolderUrlChange={(value) => updateField('photoFolderUrl', value)}
                onImageChange={handleImageChange}
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
            {/* Bouton supprimer à gauche (mode édition uniquement) */}
            {editingShow && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  handleClose();
                  void onDelete();
                }}
                className="w-full sm:w-auto sm:mr-auto"
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                Supprimer
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-derviche hover:bg-derviche-light text-white w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Réexporter les types pour compatibilité
export type { SpectacleFormData, SpectacleFormDialogProps } from './types';
