/**
 * RepresentationFormDialog - Dialog de création/édition de représentation
 * Derviche Diffusion - Session 103
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
import { Loader2 } from 'lucide-react';

// Types
import type { RepresentationFormDialogProps } from './types';

// Hook
import { useRepresentationForm } from './hooks';

// Composants
import {
  ReservationsWarning,
  FormError,
  DateTimeFields,
  VenueSelector,
  CapacityField,
  HostingFields,
} from './components';

// Constantes
import { LABELS } from './constants';

/**
 * Modale de création/édition d'une représentation
 */
export function RepresentationFormDialog({
  open,
  onOpenChange,
  editingRepresentation,
  onSubmit,
  venues,
  dervisheUsers,
  onOpenNewVenueDialog,
  newlyCreatedVenueId,
  onClearNewlyCreatedVenueId,
  hasReservations = false,
}: RepresentationFormDialogProps) {
  // Hook pour gérer toute la logique
  const {
    isEditing,
    formData,
    isUnlimited,
    isSubmitting,
    error,
    isValid,
    minDate,
    isDateTimeDisabled,
    handleDateChange,
    handleTimeChange,
    handleVenueChange,
    handleCapacityChange,
    handleUnlimitedChange,
    handleHostedByChange,
    handleHostedByIdChange,
    handleSubmit,
    handleClose,
  } = useRepresentationForm({
    open,
    editingRepresentation,
    onSubmit,
    onOpenChange,
    newlyCreatedVenueId,
    onClearNewlyCreatedVenueId,
    hasReservations,
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
            {isEditing ? LABELS.editTitle : LABELS.createTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? LABELS.editDescription : LABELS.createDescription}
          </DialogDescription>
        </DialogHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          {/* Avertissement si réservations existantes */}
          <ReservationsWarning show={hasReservations && isEditing} />

          {/* Message d'erreur serveur */}
          <FormError error={error} />

          {/* Date et Heure */}
          <DateTimeFields
            date={formData.date}
            time={formData.time}
            onDateChange={handleDateChange}
            onTimeChange={handleTimeChange}
            minDate={minDate}
            disabled={isDateTimeDisabled}
            isEditing={isEditing}
          />

          {/* Lieu */}
          <VenueSelector
            venueId={formData.venueId}
            venues={venues}
            onChange={handleVenueChange}
            onCreateNew={onOpenNewVenueDialog}
          />

          {/* Capacité */}
          <CapacityField
            capacity={formData.capacity}
            isUnlimited={isUnlimited}
            onCapacityChange={handleCapacityChange}
            onUnlimitedChange={handleUnlimitedChange}
          />

          {/* Accueil */}
          <HostingFields
            hostedBy={formData.hostedBy}
            hostedById={formData.hostedById}
            dervisheUsers={dervisheUsers}
            onHostedByChange={handleHostedByChange}
            onHostedByIdChange={handleHostedByIdChange}
          />
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {LABELS.cancel}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={!isValid || isSubmitting}
            className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="w-4 h-4 mr-2 animate-spin"
                  aria-hidden="true"
                />
                {isEditing ? LABELS.editing : LABELS.creating}
              </>
            ) : isEditing ? (
              LABELS.edit
            ) : (
              LABELS.create
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Réexporter les types pour compatibilité
export type {
  RepresentationFormData,
  RepresentationFormDialogProps,
  MockRepresentation,
  MockVenue,
  MockUser,
} from './types';
