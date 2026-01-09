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
import type { ReactNode } from 'react';

export interface DeleteConfirmDialogProps {
  /** Contrôle l'ouverture de la modale */
  open: boolean;
  /** Callback quand la modale se ferme (annulation ou clic extérieur) */
  onOpenChange: (open: boolean) => void;
  /** Callback quand l'utilisateur confirme la suppression */
  onConfirm: () => void;
  /** Titre de la modale */
  title?: string;
  /** Description/message de confirmation (peut être du texte ou du JSX) */
  description: ReactNode;
  /** Texte du bouton de confirmation */
  confirmText?: string;
  /** Texte du bouton d'annulation */
  cancelText?: string;
}

/**
 * Modale de confirmation de suppression réutilisable
 * 
 * @example
 * ```tsx
 * // Exemple simple avec texte
 * <DeleteConfirmDialog
 *   open={showToDelete !== null}
 *   onOpenChange={(open) => !open && setShowToDelete(null)}
 *   onConfirm={handleConfirmDelete}
 *   description={`Êtes-vous sûr de vouloir supprimer « ${showToDelete?.title} » ?`}
 * />
 * 
 * // Exemple avec JSX (warning, etc.)
 * <DeleteConfirmDialog
 *   open={itemToDelete !== null}
 *   onOpenChange={(open) => !open && setItemToDelete(null)}
 *   onConfirm={handleConfirmDelete}
 *   description={
 *     <div className="space-y-2">
 *       <p>Attention, cet élément a des dépendances.</p>
 *       <p>Êtes-vous sûr de vouloir continuer ?</p>
 *     </div>
 *   }
 * />
 * ```
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Confirmer la suppression',
  description,
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {/* Utilise asChild avec un div pour supporter le contenu JSX complexe */}
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full sm:w-auto text-white bg-destructive hover:bg-destructive/90"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
