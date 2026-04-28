/**
 * BookingDialogs — Modales de la page de reservation
 * Derviche Diffusion - Page spectacle
 *
 * Regroupe la modale d'authentification et la modale de
 * confirmation en cas de doublon de reservation (S184).
 */

import { AuthDialog } from '@/components/auth';
import type { AuthSuccessData } from '@/components/auth';
import { DuplicateReservationDialog } from '@/components/shared';
import type { DuplicateCheckResult } from '@/lib/services/reservations-duplicate';
import { PastSlotConfirmDialog } from './past-slot-confirm-dialog';

// ============================================
// PROPS
// ============================================

interface BookingDialogsProps {
  /** Modale d'authentification */
  showAuthModal: boolean;
  onAuthModalChange: (open: boolean) => void;
  onAuthSuccess: (data: AuthSuccessData) => void;
  onContinueAsGuest: () => void;

  /** Modale de doublon (S184) */
  showDuplicateDialog: boolean;
  duplicateInfo: DuplicateCheckResult | null;
  email: string;
  onConfirmDuplicate: () => void;
  onCancelDuplicate: () => void;

  /** Modale de confirmation « créneau passé » */
  showPastSlotDialog: boolean;
  onConfirmPastSlot: () => void;
  onCancelPastSlot: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function BookingDialogs({
  showAuthModal,
  onAuthModalChange,
  onAuthSuccess,
  onContinueAsGuest,
  showDuplicateDialog,
  duplicateInfo,
  email,
  onConfirmDuplicate,
  onCancelDuplicate,
  showPastSlotDialog,
  onConfirmPastSlot,
  onCancelPastSlot,
}: BookingDialogsProps) {
  return (
    <>
      {/* S184 : Modale de confirmation doublon */}
      <DuplicateReservationDialog
        open={showDuplicateDialog}
        onOpenChange={(open) => {
          if (!open) onCancelDuplicate();
        }}
        email={email}
        existingReservation={duplicateInfo?.existingReservation}
        onConfirm={onConfirmDuplicate}
        onCancel={onCancelDuplicate}
      />

      {/* Modale de confirmation « créneau passé » */}
      <PastSlotConfirmDialog
        open={showPastSlotDialog}
        onOpenChange={(open) => {
          if (!open) onCancelPastSlot();
        }}
        onConfirm={onConfirmPastSlot}
        onCancel={onCancelPastSlot}
      />

      {/* Modale d'authentification */}
      <AuthDialog
        open={showAuthModal}
        onOpenChange={onAuthModalChange}
        title="Gérez vos réservations facilement"
        description="Connectez-vous ou créez un compte pour retrouver toutes vos réservations. Vous pouvez aussi continuer sans compte."
        onSuccess={onAuthSuccess}
        onContinueAsGuest={onContinueAsGuest}
      />
    </>
  );
}
