/**
 * DuplicateDialog - Modale de confirmation pour doublon détecté
 * Derviche Diffusion - Session 82
 */

'use client';

import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { DuplicateDialogProps } from './types';

export function DuplicateDialog({
  open,
  onOpenChange,
  duplicateInfo,
  pendingEmail,
  onConfirm,
  onCancel,
}: DuplicateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" aria-hidden="true" />
            Réservation existante détectée
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                L&apos;email <strong>{pendingEmail}</strong> a déjà une réservation
                pour ce créneau :
              </p>
              {duplicateInfo?.existingReservation && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p className="font-medium">
                    {[
                      duplicateInfo.existingReservation.guestFirstName,
                      duplicateInfo.existingReservation.guestLastName,
                    ]
                      .filter(Boolean)
                      .join(' ') || 'Sans nom'}
                  </p>
                  <p className="text-muted-foreground">
                    {duplicateInfo.existingReservation.numPlaces} place(s) réservée(s)
                  </p>
                </div>
              )}
              <p className="text-amber-600 font-medium">
                Voulez-vous quand même créer une nouvelle réservation ?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Créer quand même
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
