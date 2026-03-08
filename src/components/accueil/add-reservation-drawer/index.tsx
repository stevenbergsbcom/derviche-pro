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

import { useEffect, useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { useAddReservation } from './useAddReservation';
import { DrawerHeader } from './DrawerHeader';
import { DuplicateDialog } from './DuplicateDialog';
import { SearchStep } from './SearchStep';
import { SelectSlotStep } from './SelectSlotStep';
import { NotificationSwitches } from '@/components/admin/reservations/notification-switches';
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
    notifOptions,
    setNotifOptions,
    setOptionalFieldsOpen,
    setCheckinFieldsOpen,
    onFormSubmit,
    handleSlotSelected,
    handleSelectProfile,
    handleSkipSearch,
    handleConfirmDuplicate,
    handleCancelDuplicate,
  } = useAddReservation({ slotId, open, onSuccess, onOpenChange });

  const steps = slotId
    ? (['search', 'form'] as const)
    : (['select-slot', 'search', 'form'] as const);

  const currentStepIndex = steps.findIndex((s) => s === state.step);

  // Hauteur réelle du viewport (se réduit quand le clavier mobile s'ouvre)
  const [vpHeight, setVpHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setVpHeight(null);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => setVpHeight(vv.height);
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [open]);

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="flex flex-col"
          style={vpHeight
            ? { minHeight: `${vpHeight * 0.9}px`, maxHeight: `${vpHeight}px` }
            : { minHeight: '90dvh', maxHeight: '95dvh' }
          }
        >
          <DrawerHeader />

          {/* Indicateur d'étape */}
          <div className="px-4 py-3 flex items-center gap-2 border-b" role="list" aria-label="Étapes">
            {steps.map((s, i) => {
              const isActive = s === state.step;
              const isDone = i < currentStepIndex;
              return (
                <span key={s} className="flex items-center gap-2" role="listitem">
                  {i > 0 && (
                    <span className="text-muted-foreground/50 text-sm" aria-hidden="true">—</span>
                  )}
                  <span
                    className="flex items-center gap-1.5"
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <span
                      className={
                        isActive
                          ? 'w-6 h-6 rounded-full bg-derviche text-white text-xs font-bold flex items-center justify-center shrink-0'
                          : isDone
                          ? 'w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0'
                          : 'w-6 h-6 rounded-full border-2 border-muted-foreground/30 text-muted-foreground/50 text-xs font-bold flex items-center justify-center shrink-0'
                      }
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span
                      className={
                        isActive
                          ? 'text-sm font-semibold text-derviche'
                          : isDone
                          ? 'text-sm text-muted-foreground'
                          : 'text-sm text-muted-foreground/50'
                      }
                    >
                      {STEP_LABELS[s]}
                    </span>
                  </span>
                </span>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Étape 1 : Sélection show/créneau */}
            {state.step === 'select-slot' && (
              <div className="p-5">
                <SelectSlotStep
                  onSlotSelected={handleSlotSelected}
                  disabled={state.isSubmitting}
                />
              </div>
            )}

            {/* Étape 2 : Recherche */}
            {state.step === 'search' && (
              <div className="p-5">
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
                <div className="p-5 space-y-5">
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
                  />
                </div>

                {/* Notifications */}
                <div className="px-5 pb-2">
                  <NotificationSwitches
                    value={notifOptions}
                    onChange={setNotifOptions}
                    disabled={state.isSubmitting}
                    label="Notifier le professionnel"
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
