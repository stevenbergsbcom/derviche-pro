/**
 * WalkInDrawer — Drawer de création de réservation walk-in
 * Derviche Diffusion
 *
 * Drawer mobile-first en 2 étapes :
 *   1. EmailSearchStep  : recherche du professionnel par email
 *   2. ReservationFormStep : formulaire complet + soumission
 *
 * Placé globalement dans le layout accueil via WalkInFAB.
 */

'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import { useWalkInReservation } from './hooks/useWalkInReservation';
import { EmailSearchStep, ReservationFormStep } from './steps';
import { STEP_LABELS } from './constants';
import type { WalkInDrawerProps } from './types';

// ============================================
// RÉ-EXPORT TYPES
// ============================================

export type { WalkInDrawerProps } from './types';

// ============================================
// COMPOSANT
// ============================================

export function WalkInDrawer({
  open,
  onOpenChange,
  defaultShowId,
  defaultShowSlug,
  defaultSlotId,
  onSuccess,
}: WalkInDrawerProps) {
  const { role } = useCheckinAccess();
  const isAdmin = role === 'super-admin' || role === 'admin';

  const walkin = useWalkInReservation({
    defaultShowId,
    defaultShowSlug,
    defaultSlotId,
    onSuccess: (reservationId) => {
      onSuccess?.(reservationId);
      onOpenChange(false);
    },
  });

  // Fermeture : reset complet avant de fermer
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !walkin.isSubmitting) {
      walkin.reset();
    }
    onOpenChange(nextOpen);
  };

  // Nom du professionnel pour la description (si déjà saisi)
  const profileSummary =
    walkin.foundProfile
      ? `${walkin.foundProfile.firstName ?? ''} ${walkin.foundProfile.lastName ?? ''}`.trim()
      : null;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        {/* En-tête */}
        <DrawerHeader className="border-b pb-3">
          <DrawerTitle className="text-base">
            Nouvelle réservation
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
            {walkin.step === 'email-search'
              ? STEP_LABELS['email-search']
              : profileSummary
              ? `Réservation pour ${profileSummary}`
              : STEP_LABELS['form']}
          </DrawerDescription>
        </DrawerHeader>

        {/* Corps scrollable */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Indicateur d'étape */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={
                walkin.step === 'email-search'
                  ? 'font-semibold text-derviche'
                  : 'text-muted-foreground'
              }
              aria-current={walkin.step === 'email-search' ? 'step' : undefined}
            >
              1. Recherche
            </span>
            <span aria-hidden="true">›</span>
            <span
              className={
                walkin.step === 'form'
                  ? 'font-semibold text-derviche'
                  : 'text-muted-foreground'
              }
              aria-current={walkin.step === 'form' ? 'step' : undefined}
            >
              2. Formulaire
            </span>
          </div>

          {/* Étape 1 : Recherche email */}
          {walkin.step === 'email-search' && (
            <EmailSearchStep
              searchEmail={walkin.searchEmail}
              onEmailChange={walkin.setSearchEmail}
              isSearching={walkin.isSearching}
              searchDone={walkin.searchDone}
              foundProfileName={
                walkin.foundProfile
                  ? `${walkin.foundProfile.firstName ?? ''} ${walkin.foundProfile.lastName ?? ''}`.trim() || null
                  : null
              }
              foundProfileOrg={walkin.foundProfile?.organization ?? null}
              onSearch={walkin.handleEmailSearch}
              onContinue={walkin.goToForm}
              disabled={walkin.isSubmitting}
            />
          )}

          {/* Étape 2 : Formulaire */}
          {walkin.step === 'form' && (
            <ReservationFormStep
              formData={walkin.formData}
              onFieldChange={walkin.setFormField}
              onShowChange={walkin.handleShowChange}
              shows={walkin.shows}
              loadingShows={walkin.loadingShows}
              slots={walkin.slots}
              loadingSlots={walkin.loadingSlots}
              isAdmin={isAdmin}
              isSubmitting={walkin.isSubmitting}
              notifOptions={walkin.notifOptions}
              onNotifChange={walkin.setNotifOptions}
              capacityWarning={walkin.capacityWarning}
              onClearCapacityWarning={walkin.clearCapacityWarning}
              submitError={walkin.submitError}
              onBack={walkin.goBack}
              onSubmit={walkin.handleSubmit}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
