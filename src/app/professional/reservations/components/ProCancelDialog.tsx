/**
 * Dialog de confirmation d'annulation d'une réservation
 * Espace professionnel — Derviche Pro
 *
 * @module professional/reservations/components/ProCancelDialog
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// ============================================
// TYPES
// ============================================

interface ProCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTitle: string;
  onConfirm: (reason?: string) => Promise<void>;
  isCancelling: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function ProCancelDialog({
  open,
  onOpenChange,
  showTitle,
  onConfirm,
  isCancelling,
}: ProCancelDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = async () => {
    try {
      await onConfirm(reason.trim() || undefined);
      // On ne vide le champ que si l'annulation a réussi.
      // En cas d'erreur, onConfirm lève une exception et on conserve
      // le motif saisi pour éviter à l'utilisateur de le retaper.
      setReason('');
    } catch {
      // L'erreur est déjà gérée (toast) dans le parent.
      // On ne fait rien ici : le dialog reste ouvert, le motif est conservé.
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!isCancelling) {
      if (!newOpen) setReason('');
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Annuler la réservation</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir annuler votre réservation pour{' '}
            <span className="font-semibold text-foreground">{showTitle}</span> ?
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="cancel-reason" className="text-sm">
            Motif d&apos;annulation{' '}
            <span className="text-muted-foreground">(optionnel)</span>
          </Label>
          <Textarea
            id="cancel-reason"
            placeholder="Précisez la raison si vous le souhaitez..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            disabled={isCancelling}
            className="resize-none"
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={() => handleClose(false)}
            disabled={isCancelling}
            className="w-full sm:w-auto"
          >
            Garder ma réservation
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={isCancelling}
            className="w-full sm:w-auto"
          >
            {isCancelling ? 'Annulation...' : 'Confirmer l\'annulation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
