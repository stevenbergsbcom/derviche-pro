/**
 * Dialog de création d'une nouvelle réservation (admin)
 * Derviche Diffusion - Session 104
 * 
 * Composant orchestrateur refactorisé.
 * Logique extraite dans useCreateReservationForm.
 * UI découpée en sections modulaires.
 */

'use client';

import { Loader2, Plus } from 'lucide-react';
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
import type { CreateReservationDialogProps } from './types';

// Hook principal
import { useCreateReservationForm } from './hooks';
import { NotificationSwitches } from '@/components/admin/reservations/notification-switches';

// Composants de section
import {
  ValidationErrors,
  ShowSlotSection,
  PersonalInfoSection,
  ProfessionalInfoSection,
  AddressSection,
  NotesSection,
} from './components';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function CreateReservationDialog({ 
  open, 
  onOpenChange, 
  shows,
  onGetSlots, 
  onCreate,
}: CreateReservationDialogProps) {
  const {
    // État du formulaire
    formData,
    selectedShowId,
    maxPlaces,
    
    // État des créneaux
    availableSlots,
    loadingSlots,
    slotsError,
    
    // État de validation et soumission
    validationErrors,
    isSaving,
    
    // Spectacles filtrés
    publishedShows,

    // Notifications
    notifOptions,
    setNotifOptions,
    
    // Handlers
    handleShowChange,
    handleFieldChange,
    handleSubmit,
    handleClose,
  } = useCreateReservationForm({
    open,
    shows,
    onGetSlots,
    onCreate,
    onOpenChange,
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" aria-hidden="true" />
            Nouvelle réservation
          </DialogTitle>
          <DialogDescription>
            Créez une réservation pour un professionnel depuis l&apos;interface admin.
          </DialogDescription>
        </DialogHeader>

        {/* Erreurs de validation */}
        <ValidationErrors errors={validationErrors} />

        <div className="space-y-6 py-4">
          {/* Section: Spectacle et Créneau */}
          <ShowSlotSection
            selectedShowId={selectedShowId}
            onShowChange={handleShowChange}
            publishedShows={publishedShows}
            slotId={formData.slotId}
            onSlotChange={(slotId) => handleFieldChange('slotId', slotId)}
            loadingSlots={loadingSlots}
            slotsError={slotsError}
            availableSlots={availableSlots}
            numPlaces={formData.numPlaces}
            onNumPlacesChange={(num) => handleFieldChange('numPlaces', num)}
            maxPlaces={maxPlaces}
            disabled={isSaving}
          />

          {/* Section: Informations personnelles */}
          <PersonalInfoSection
            firstName={formData.firstName}
            lastName={formData.lastName}
            email={formData.email}
            phone={formData.phone ?? null}
            emailSecondary={formData.emailSecondary ?? null}
            phoneSecondary={formData.phoneSecondary ?? null}
            onChange={handleFieldChange}
            disabled={isSaving}
          />

          {/* Section: Professionnel */}
          <ProfessionalInfoSection
            organization={formData.organization ?? null}
            function={formData.function ?? null}
            afcNumber={formData.afcNumber ?? null}
            onChange={handleFieldChange}
            disabled={isSaving}
          />

          {/* Section: Adresse */}
          <AddressSection
            address={formData.address ?? null}
            postalCode={formData.postalCode ?? null}
            city={formData.city ?? null}
            country={formData.country ?? null}
            onChange={handleFieldChange}
            disabled={isSaving}
          />

          {/* Section: Notes */}
          <NotesSection
            comment={formData.comment ?? null}
            checkinComment={formData.checkinComment ?? null}
            checkinVenueNotes={formData.checkinVenueNotes ?? null}
            checkinInternalNotes={formData.checkinInternalNotes ?? null}
            onChange={handleFieldChange}
            disabled={isSaving}
          />
        </div>

        {/* Switches de notification */}
        <NotificationSwitches
          value={notifOptions}
          onChange={setNotifOptions}
          disabled={isSaving}
          label="Notifier le professionnel"
        />

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isSaving} 
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving || !formData.slotId} 
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Création...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Créer la réservation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export par défaut pour compatibilité
export default CreateReservationDialog;
