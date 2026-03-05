/**
 * AddReservationDrawer - Formulaire d'ajout de réservation
 * Derviche Diffusion - Session 82 / enrichi S140
 *
 * Drawer en 3 étapes :
 *   1. SelectSlotStep  — sélection show + créneau (si pas de slotId)
 *   2. SearchStep      — recherche email/nom (pré-remplissage)
 *   3. Formulaire      — UI existante intacte
 */

'use client';

import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { useAddReservation } from './useAddReservation';
import { DrawerHeader } from './DrawerHeader';
import { DuplicateDialog } from './DuplicateDialog';
import { SearchStep } from './SearchStep';
import { SelectSlotStep } from './SelectSlotStep';
import {
  RequiredFieldsSection,
  OptionalFieldsSection,
  CheckinFieldsSection,
  FormFooter,
} from './sections';
import type { AddReservationDrawerProps } from './types';

export type { AddReservationDrawerProps } from './types';

const STEP_LABELS = {
  'select-slot': 'Représentation',
  'search': 'Recherche',
  'form': 'Formulaire',
} as const;

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
    handleSlotSelected,
    handleSelectProfile,
    handleSkipSearch,
    handleConfirmDuplicate,
    handleCancelDuplicate,
    isAdmin,
  } = useAddReservation({ slotId, open, onSuccess, onOpenChange });

  const steps = slotId
    ? (['search', 'form'] as const)
    : (['select-slot', 'search', 'form'] as const);

  const currentStepIndex = steps.findIndex((s) => s === state.step);

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader capacityInfo={state.capacityInfo} />

          {/* Indicateur d'étape */}
          <div className="px-4 pb-3 flex items-center gap-1.5 text-xs text-muted-foreground border-b">
            {steps.map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true">›</span>}
                <span
                  className={
                    s === state.step
                      ? 'font-semibold text-derviche'
                      : i < currentStepIndex
                      ? 'text-muted-foreground line-through'
                      : 'text-muted-foreground'
                  }
                  aria-current={s === state.step ? 'step' : undefined}
                >
                  {STEP_LABELS[s]}
                </span>
              </span>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Étape 1 : Sélection show/créneau */}
            {state.step === 'select-slot' && (
              <div className="p-4">
                <SelectSlotStep
                  onSlotSelected={handleSlotSelected}
                  disabled={state.isSubmitting}
                />
              </div>
            )}

            {/* Étape 2 : Recherche */}
            {state.step === 'search' && (
              <div className="p-4">
                <SearchStep
                  onSelect={handleSelectProfile}
                  onSkip={handleSkipSearch}
                  disabled={state.isSubmitting}
                />
              </div>
            )}

            {/* Étape 3 : Formulaire */}
            {state.step === 'form' && (
              <form onSubmit={onFormSubmit}>
                <div className="p-4 space-y-4">
                  <RequiredFieldsSection form={form} isSubmitting={state.isSubmitting} />
                  <Separator />
                  <OptionalFieldsSection
                    form={form}
                    isSubmitting={state.isSubmitting}
                    isOpen={state.optionalFieldsOpen}
                    onOpenChange={setOptionalFieldsOpen}
                  />
                  <Separator />
                  <CheckinFieldsSection
                    form={form}
                    isSubmitting={state.isSubmitting}
                    isOpen={state.checkinFieldsOpen}
                    onOpenChange={setCheckinFieldsOpen}
                    isAdmin={isAdmin}
                  />
                </div>
                <FormFooter isSubmitting={state.isSubmitting} />
              </form>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <DuplicateDialog
        open={state.showDuplicateDialog}
        onOpenChange={(open) => { if (!open) handleCancelDuplicate(); }}
        duplicateInfo={state.duplicateInfo}
        pendingEmail={form.getValues('email')}
        onConfirm={handleConfirmDuplicate}
        onCancel={handleCancelDuplicate}
      />
    </>
  );
}
