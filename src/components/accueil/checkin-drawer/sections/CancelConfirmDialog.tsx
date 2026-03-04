/**
 * CancelConfirmDialog — Modale de confirmation d'annulation PWA
 * Derviche Diffusion — Session 139
 *
 * Affiche une confirmation explicite avant d'annuler une réservation
 * depuis l'interface de check-in, avec les switches de notification.
 */

'use client';

import { useState, useEffect } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  NotificationSwitches,
  DEFAULT_NOTIFICATION_OPTIONS,
  type NotificationOptions,
} from '@/components/admin/reservations/notification-switches';

// ============================================
// TYPES
// ============================================

export interface CancelConfirmDialogProps {
  /** Indique si la modale est ouverte */
  open: boolean;
  /** Handler pour fermer/ouvrir la modale */
  onOpenChange: (open: boolean) => void;
  /** Nom complet du guest (affiché dans la confirmation) */
  guestName: string;
  /** Un événement Google Calendar existe-t-il ? */
  hasCalendarEvent?: boolean;
  /** Handler de confirmation — reçoit les options de notification choisies */
  onConfirm: (notifOptions: NotificationOptions) => void;
  /** En cours de traitement ? */
  isProcessing: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function CancelConfirmDialog({
  open,
  onOpenChange,
  guestName,
  hasCalendarEvent,
  onConfirm,
  isProcessing,
}: CancelConfirmDialogProps) {
  const [notifOptions, setNotifOptions] = useState<NotificationOptions>(
    DEFAULT_NOTIFICATION_OPTIONS
  );

  // Reset des options à chaque ouverture
  useEffect(() => {
    if (open) {
      setNotifOptions(DEFAULT_NOTIFICATION_OPTIONS);
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(notifOptions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Ban className="w-5 h-5" />
            Annuler la réservation
          </DialogTitle>
          <DialogDescription asChild>
            <span className="block mt-1 text-sm text-foreground">
              Confirmer l&apos;annulation de la réservation de{' '}
              <strong>{guestName}</strong> ?
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-1">
          <NotificationSwitches
            value={notifOptions}
            onChange={setNotifOptions}
            disabled={isProcessing}
            label="Notifications"
            hasCalendarEvent={hasCalendarEvent}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Retour
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Annulation...
              </>
            ) : (
              <>
                <Ban className="w-4 h-4 mr-2" />
                Confirmer l&apos;annulation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
