/**
 * UnsavedChangesDialog - Dialog de confirmation pour modifications non sauvegardées
 * Derviche Diffusion - Admin Preferences
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

interface UnsavedChangesDialogProps {
  /** Dialog ouvert ou non */
  open: boolean;
  /** Callback quand l'utilisateur annule (reste sur la page) */
  onCancel: () => void;
  /** Callback quand l'utilisateur confirme (quitte sans sauvegarder) */
  onConfirm: () => void;
}

export function UnsavedChangesDialog({
  open,
  onCancel,
  onConfirm,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <AlertDialogTitle>Modifications non sauvegardées</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Vous avez des modifications en cours qui n&apos;ont pas été enregistrées.
            Si vous quittez maintenant, ces changements seront perdus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Rester sur cette page
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Quitter sans sauvegarder
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
