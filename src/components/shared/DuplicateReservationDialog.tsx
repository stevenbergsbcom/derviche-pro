/**
 * DuplicateReservationDialog — Modale de confirmation pour doublon de réservation
 * Derviche Diffusion — Session S184
 *
 * Composant partagé réutilisé par les 3 formulaires :
 * - Formulaire public (spectacle/[slug])
 * - Dialog admin (create-reservation-dialog)
 * - Drawer PWA (add-reservation-drawer)
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
import type { DuplicateExistingReservation } from '@/lib/services/reservations-duplicate';

// ============================================
// TYPES
// ============================================

export interface DuplicateReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  existingReservation?: DuplicateExistingReservation | null;
  onConfirm: () => void;
  onCancel: () => void;
}

// ============================================
// COMPOSANT
// ============================================

export function DuplicateReservationDialog({
  open,
  onOpenChange,
  email,
  existingReservation,
  onConfirm,
  onCancel,
}: DuplicateReservationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" aria-hidden="true" />
            Réservation existante détectée
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                L&apos;email <strong>{email}</strong> a déjà une réservation pour ce créneau
                {'\u00A0'}:
              </p>
              {existingReservation && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p className="font-medium">
                    {[existingReservation.firstName, existingReservation.lastName]
                      .filter(Boolean)
                      .join(' ') || 'Sans nom'}
                  </p>
                  <p className="text-muted-foreground">
                    {existingReservation.numPlaces} place(s) réservée(s)
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
