/**
 * AddReservationDrawer - Formulaire d'ajout de réservation
 * Derviche Diffusion - Session 82
 *
 * Composant orchestrateur refactorisé en structure modulaire :
 * - useAddReservation : hook avec états et handlers
 * - sections/ : composants UI du formulaire
 * - DuplicateDialog : modale confirmation doublon
 *
 * Permet au staff d'accueil de créer une réservation sur place
 * avec tous les champs du formulaire public + options check-in
 */

'use client';

import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { useAddReservation } from './useAddReservation';
import { DrawerHeader } from './DrawerHeader';
import { DuplicateDialog } from './DuplicateDialog';
import {
  RequiredFieldsSection,
  OptionalFieldsSection,
  CheckinFieldsSection,
  FormFooter,
} from './sections';
import type { AddReservationDrawerProps } from './types';

// Re-export des types pour la rétrocompatibilité
export type { AddReservationDrawerProps } from './types';

export function AddReservationDrawer({
  slotId,
  open,
  onOpenChange,
  onSuccess,
}: AddReservationDrawerProps) {
  const {
    form,
    state,
    setOptionalFieldsOpen,
    setCheckinFieldsOpen,
    onFormSubmit,
    handleConfirmDuplicate,
    handleCancelDuplicate,
    isAdmin,
  } = useAddReservation({
    slotId,
    open,
    onSuccess,
    onOpenChange,
  });

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader capacityInfo={state.capacityInfo} />

          {/* Corps du formulaire - scrollable */}
          <form onSubmit={onFormSubmit} className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Section : Informations obligatoires */}
              <RequiredFieldsSection
                form={form}
                isSubmitting={state.isSubmitting}
              />

              <Separator />

              {/* Section : Champs optionnels (dépliable) */}
              <OptionalFieldsSection
                form={form}
                isSubmitting={state.isSubmitting}
                isOpen={state.optionalFieldsOpen}
                onOpenChange={setOptionalFieldsOpen}
              />

              <Separator />

              {/* Section : Check-in (dépliable) */}
              <CheckinFieldsSection
                form={form}
                isSubmitting={state.isSubmitting}
                isOpen={state.checkinFieldsOpen}
                onOpenChange={setCheckinFieldsOpen}
                isAdmin={isAdmin}
              />
            </div>

            {/* Footer avec boutons */}
            <FormFooter isSubmitting={state.isSubmitting} />
          </form>
        </DrawerContent>
      </Drawer>

      {/* Modale de confirmation doublon */}
      <DuplicateDialog
        open={state.showDuplicateDialog}
        onOpenChange={(open) => {
          if (!open) handleCancelDuplicate();
        }}
        duplicateInfo={state.duplicateInfo}
        pendingEmail={form.getValues('email')}
        onConfirm={handleConfirmDuplicate}
        onCancel={handleCancelDuplicate}
      />
    </>
  );
}
