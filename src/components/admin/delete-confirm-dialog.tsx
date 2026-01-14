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
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

export interface DeleteConfirmDialogProps {
  /** Contrôle l'ouverture de la modale */
  open: boolean;
  /** Callback quand la modale se ferme (annulation ou clic extérieur) */
  onOpenChange: (open: boolean) => void;
  /** Callback quand l'utilisateur confirme la suppression (peut être async) */
  onConfirm: () => void | Promise<void>;
  /** Titre de la modale */
  title?: string;
  /** Description/message de confirmation (peut être du texte ou du JSX) */
  description: ReactNode;
  /** Texte du bouton de confirmation */
  confirmText?: string;
  /** Texte du bouton d'annulation */
  cancelText?: string;
  /** Désactive le bouton de confirmation (ex: si élément utilisé ailleurs) */
  confirmDisabled?: boolean;
  /** Indique si une opération est en cours (désactive le bouton) */
  isSubmitting?: boolean;
  /** Message d'erreur à afficher (si présent) */
  error?: string | null;
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
 * 
 * // Exemple avec confirmation désactivée (élément utilisé)
 * <DeleteConfirmDialog
 *   open={venueToDelete !== null}
 *   onOpenChange={(open) => !open && setVenueToDelete(null)}
 *   onConfirm={handleConfirmDelete}
 *   description="Ce lieu est utilisé par 5 représentations."
 *   confirmDisabled={true}
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
  confirmDisabled = false,
  isSubmitting = false,
  error = null,
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
        {/* Affichage de l'erreur */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto" disabled={isSubmitting}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={confirmDisabled || isSubmitting}
            className="w-full sm:w-auto text-white bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Suppression...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
