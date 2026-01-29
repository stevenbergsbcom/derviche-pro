/**
 * Composant CancelDialog pour la page des réservations admin
 * Dialog d'annulation avec champ motif optionnel
 * Extrait de page.tsx - Session 106
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Ban, Loader2 } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface CancelDialogReservation {
  id: string;
  firstName: string;
  lastName: string;
}

export interface CancelDialogProps {
  /** Indique si le dialog est ouvert */
  open: boolean;
  /** Handler pour fermer/ouvrir le dialog */
  onOpenChange: (open: boolean) => void;
  /** Réservation sélectionnée */
  reservation: CancelDialogReservation | null;
  /** Handler pour confirmer l'annulation */
  onCancel: (reason?: string) => void;
  /** Indique si une action est en cours */
  isProcessing: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function CancelDialog({
  open,
  onOpenChange,
  reservation,
  onCancel,
  isProcessing,
}: CancelDialogProps) {
  const [cancelReason, setCancelReason] = useState('');

  // Reset du motif quand le dialog se ferme
  useEffect(() => {
    if (!open) {
      setCancelReason('');
    }
  }, [open]);

  const handleConfirm = () => {
    onCancel(cancelReason || undefined);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Annuler la réservation</DialogTitle>
          <DialogDescription>
            {reservation && (
              <span className="block mt-1">
                Réservation de{' '}
                <strong>
                  {reservation.firstName} {reservation.lastName}
                </strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Label className="text-sm">Motif (optionnel)</Label>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Raison de l'annulation..."
            className="mt-2"
            rows={3}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
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
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Ban className="w-4 h-4 mr-2" />
            )}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
