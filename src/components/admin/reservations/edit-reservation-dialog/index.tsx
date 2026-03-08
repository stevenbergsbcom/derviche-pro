/**
 * Dialog de modification d'une réservation
 * Derviche Diffusion - Session 111
 * 
 * Composant orchestrateur refactorisé.
 * Logique métier extraite dans useEditReservation.
 */

'use client';

import { Loader2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationSwitches } from '@/components/admin/reservations/notification-switches';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEditReservation } from './hooks';
import { buildDialogDescription } from './utils';
import { BUTTON_LABELS, INFO_MESSAGES } from './constants';
import {
  CancelledBanner,
  AnomalyBanner,
  ValidationErrors,
  CheckinAndEmailsSection,
  SlotPlacesSection,
  PersonalInfoSection,
  ProfessionalInfoSection,
  AddressSection,
  NotesSection,
} from './components';
import { useState, useEffect } from 'react';
import type { EditReservationDialogProps } from './types';
import type { CheckinStatus } from '@/types/database';
import { updateReservationCheckin } from '@/lib/services/admin-reservations';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function EditReservationDialog({
  open,
  onOpenChange,
  reservation,
  onSave,
  onCancel,
  onGetSlots,
  isSaving,
  onCheckinUpdated,
}: EditReservationDialogProps) {
  // Hook de gestion du formulaire
  const {
    formData,
    availableSlots,
    loadingSlots,
    slotsError,
    validationErrors,
    isFormReady,
    notifOptions,
    setNotifOptions,
    handleChange,
    handleSubmit,
    handleCancelReservation,
    handleOpenChange,
  } = useEditReservation({
    reservation,
    open,
    onSave,
    onCancel,
    onOpenChange,
    onGetSlots,
  });

  // État local du statut checkin — doit être avant tout return conditionnel
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(
    reservation?.checkinStatus ?? null
  );
  const [isUpdatingCheckin, setIsUpdatingCheckin] = useState(false);

  // Synchroniser si la réservation change (ex: deep-link)
  useEffect(() => {
    setCheckinStatus(reservation?.checkinStatus ?? null);
  }, [reservation?.id, reservation?.checkinStatus]);

  // Ne pas rendre si pas de réservation
  if (!reservation) return null;

  const isCancelled = reservation.status === 'cancelled';
  // Afficher les switches de notif seulement si le créneau a changé
  const slotChanged = formData?.slotId !== undefined && formData.slotId !== reservation.slot?.id;

  const handleCheckinChange = async (status: CheckinStatus | null) => {
    if (status === checkinStatus) return;
    setCheckinStatus(status); // optimiste
    setIsUpdatingCheckin(true);
    try {
      if (status !== null) {
        const { error: checkinError } = await updateReservationCheckin(reservation.id, { checkinStatus: status });
        if (checkinError) throw new Error(checkinError);
      } else {
        // Reset à null : mise à jour directe via Supabase client
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { error } = await supabase
          .from('reservations')
          .update({ checkin_status: null, checkin_at: null })
          .eq('id', reservation.id);
        if (error) throw error;
      }
      // Notifier le parent pour rafraîchir ses données (corrige le bouton stale)
      onCheckinUpdated?.(reservation.id, status);
    } catch {
      setCheckinStatus(reservation?.checkinStatus ?? null); // rollback
    } finally {
      setIsUpdatingCheckin(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la réservation</DialogTitle>
          <DialogDescription>
            {buildDialogDescription(reservation)}
          </DialogDescription>
        </DialogHeader>

        {/* Banners d'alerte */}
        {isCancelled && (
          <CancelledBanner
            cancelledAt={reservation.cancelledAt}
            cancellationReason={reservation.cancellationReason}
          />
        )}
        
        <AnomalyBanner hasAnomaly={reservation.hasDataAnomaly} />
        
        <ValidationErrors errors={validationErrors} />

        {/* Checkin & Emails */}
        <CheckinAndEmailsSection
          reservationId={reservation.id}
          reservationStatus={reservation.status as 'confirmed' | 'cancelled' | 'no_show'}
          currentCheckinStatus={checkinStatus}
          guestEmail={reservation.email}
          checkinFollowupEmails={reservation.checkinFollowupEmails}
          isSaving={isSaving || isUpdatingCheckin}
          onCheckinChange={(s) => void handleCheckinChange(s)}
        />

        {/* Indicateur de chargement du formulaire */}
        {!isFormReady && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-derviche" aria-hidden="true" />
            <span className="ml-2 text-sm text-muted-foreground">
              {INFO_MESSAGES.loadingForm}
            </span>
          </div>
        )}

        {/* Formulaire */}
        {isFormReady && formData && (
          <div className="space-y-6 py-4">
            <SlotPlacesSection
              slotId={formData.slotId || ''}
              numPlaces={formData.numPlaces || 1}
              availableSlots={availableSlots}
              loadingSlots={loadingSlots}
              slotsError={slotsError}
              onSlotChange={(slotId) => handleChange('slotId', slotId)}
              onNumPlacesChange={(numPlaces) => handleChange('numPlaces', numPlaces)}
              disabled={isSaving}
            />

            <PersonalInfoSection
              firstName={formData.firstName || ''}
              lastName={formData.lastName || ''}
              email={formData.email || ''}
              phone={formData.phone ?? null}
              emailSecondary={formData.emailSecondary ?? null}
              phoneSecondary={formData.phoneSecondary ?? null}
              onChange={handleChange}
              disabled={isSaving}
            />

            <ProfessionalInfoSection
              organization={formData.organization ?? null}
              function={formData.function ?? null}
              afcNumber={formData.afcNumber ?? null}
              onChange={handleChange}
              disabled={isSaving}
            />

            <AddressSection
              address={formData.address ?? null}
              postalCode={formData.postalCode ?? null}
              city={formData.city ?? null}
              onChange={handleChange}
              disabled={isSaving}
            />

            <NotesSection
              specialRequests={formData.specialRequests ?? null}
              checkinComment={formData.checkinComment ?? null}
              checkinVenueNotes={formData.checkinVenueNotes ?? null}
              checkinInternalNotes={formData.checkinInternalNotes ?? null}
              onChange={handleChange}
              disabled={isSaving}
            />
          </div>
        )}

        {/* Switches de notification — uniquement si le créneau a changé */}
        {isFormReady && slotChanged && (
          <NotificationSwitches
            value={notifOptions}
            onChange={setNotifOptions}
            disabled={isSaving}
            label="Notifier le professionnel"
            hasCalendarEvent={
              reservation.googleCalendarEventId != null
                ? !!reservation.googleCalendarEventId
                : undefined
            }
          />
        )}

        {/* Actions */}
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          {!isCancelled && (
            <Button
              variant="destructive"
              onClick={handleCancelReservation}
              disabled={isSaving}
              className="w-full sm:w-auto sm:mr-auto"
              aria-label={BUTTON_LABELS.cancelReservation}
            >
              <Ban className="w-4 h-4 mr-2" aria-hidden="true" />
              {BUTTON_LABELS.cancelReservation}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {BUTTON_LABELS.close}
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            )}
            {BUTTON_LABELS.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
