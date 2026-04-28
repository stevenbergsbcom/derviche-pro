/**
 * PastSlotConfirmDialog — Modale de confirmation « créneau passé »
 * Derviche Diffusion - Page spectacle
 *
 * Affichée quand l'utilisateur tente de réserver un créneau dont l'horaire
 * est déjà passé (heure du jour antérieure à maintenant). Le code DB autorise
 * déjà cette réservation ; cette modale est purement une confirmation UX
 * pour éviter les soumissions par erreur.
 */

'use client';

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

interface PastSlotConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Confirme la création de la réservation malgré l'horaire passé. */
  onConfirm: () => void;
  /** Annule la confirmation et ferme la modale. */
  onCancel: () => void;
}

export function PastSlotConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: PastSlotConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cette représentation a déjà commencé</AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;horaire du créneau sélectionné est passé. Voulez-vous
            tout de même confirmer la réservation&nbsp;?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Oui, confirmer la réservation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
