/**
 * CheckinDrawer - Drawer de pointage des invités
 * Derviche Diffusion
 * 
 * Permet de marquer le statut de présence d'un invité
 * avec 4 options : Présent, Coup de cœur, Presse, Absent
 * + commentaire, notes venue, notes internes (staff DD uniquement, pas les compagnies)
 * + édition des 13 champs guest
 */

'use client';

import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';

import { useCheckinDrawer } from './useCheckinDrawer';
import {
  HeaderSection,
  CancelledBanner,
  StatusButtonsSection,
  GuestInfoSection,
  NotesSection,
  FooterSection,
} from './sections';
import { CancelConfirmDialog } from './sections/CancelConfirmDialog';

import type { CheckinDrawerProps } from './types';

// ============================================
// RÉ-EXPORT DES TYPES
// ============================================

export type { CheckinDrawerProps } from './types';

// ============================================
// COMPOSANT
// ============================================

export function CheckinDrawer({
  reservation,
  open,
  onOpenChange,
  onSuccess,
  onTransferClick,
}: CheckinDrawerProps) {
  // Hook personnalisé pour toute la logique
  const drawer = useCheckinDrawer({
    reservation,
    onSuccess,
    onOpenChange,
  });

  // Si pas de réservation, ne rien afficher
  if (!reservation) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        {/* En-tête */}
        <HeaderSection
          displayName={drawer.displayName}
          numPlaces={reservation.numPlaces}
          onTransferClick={onTransferClick}
          isCancelled={drawer.isCancelled}
          isSubmitting={drawer.uiState.isSubmitting}
        />

        {/* Corps du drawer - scrollable */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {/* Bandeau annulation / réactivation */}
          <CancelledBanner
            isCancelled={drawer.isCancelled}
            justReactivated={drawer.uiState.justReactivated}
            isSubmitting={drawer.uiState.isSubmitting}
            onReactivate={drawer.handleReactivate}
            reactivateNotifOptions={drawer.reactivateNotifOptions}
            onReactivateNotifChange={drawer.setReactivateNotifOptions}
          />

          {/* Boutons de statut de présence */}
          <StatusButtonsSection
            selectedStatus={drawer.checkinForm.selectedStatus}
            onStatusChange={drawer.setSelectedStatus}
            isCancelled={drawer.isCancelled}
            isSubmitting={drawer.uiState.isSubmitting}
          />

          {/* Séparateur - masqué si annulée (pas de boutons) */}
          {!drawer.isCancelled && <Separator />}

          {/* Informations du professionnel */}
          <GuestInfoSection
            guestForm={drawer.guestForm}
            detailsOpen={drawer.uiState.detailsOpen}
            isSubmitting={drawer.uiState.isSubmitting}
            onDetailsOpenChange={drawer.setDetailsOpen}
            onFirstNameChange={drawer.setGuestFirstName}
            onLastNameChange={drawer.setGuestLastName}
            onEmailChange={drawer.setGuestEmail}
            onEmailSecondaryChange={drawer.setGuestEmailSecondary}
            onPhoneChange={drawer.setGuestPhone}
            onPhoneSecondaryChange={drawer.setGuestPhoneSecondary}
            onStructureChange={drawer.setGuestStructure}
            onFunctionChange={drawer.setGuestFunction}
            onAddressChange={drawer.setGuestAddress}
            onPostalCodeChange={drawer.setGuestPostalCode}
            onCityChange={drawer.setGuestCity}
            onCountryChange={drawer.setGuestCountry}
            onAfcNumberChange={drawer.setGuestAfcNumber}
            onSpecialRequestsChange={drawer.setSpecialRequests}
          />

          <Separator />

          {/* Notes (commentaire, venue, internes) */}
          <NotesSection
            checkinForm={drawer.checkinForm}
            isSubmitting={drawer.uiState.isSubmitting}
            onCommentChange={drawer.setComment}
            onVenueNotesChange={drawer.setVenueNotes}
            onInternalNotesChange={drawer.setInternalNotes}
          />
        </div>

        {/* Footer avec boutons */}
        <FooterSection
          selectedStatus={drawer.checkinForm.selectedStatus}
          hasChanges={drawer.hasChanges}
          canSave={drawer.canSave}
          isCancelled={drawer.isCancelled}
          isSubmitting={drawer.uiState.isSubmitting}
          onSave={drawer.handleSave}
          onCancelClick={drawer.handleCancelClick}
        />

        {/* Modale de confirmation d'annulation */}
        <CancelConfirmDialog
          open={drawer.cancelDialogOpen}
          onOpenChange={drawer.setCancelDialogOpen}
          guestName={drawer.displayName}
          hasCalendarEvent={drawer.hasCalendarEvent}
          onConfirm={drawer.handleCancel}
          isProcessing={drawer.uiState.isSubmitting}
        />
      </DrawerContent>
    </Drawer>
  );
}
