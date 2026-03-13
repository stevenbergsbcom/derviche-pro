/**
 * DeleteAccountDialog — Dialog suppression de compte (RGPD Art. 17)
 * Derviche Diffusion - Mon Compte
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';

import type { DeleteStep } from '../types';

// ============================================
// PROPS
// ============================================

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deleteStep: DeleteStep;
  deleteConfirmText: string;
  onConfirmTextChange: (text: string) => void;
  deleteError: string | null;
  onDeleteError: (error: string | null) => void;
  onDelete: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function DeleteAccountDialog({
  isOpen,
  onClose,
  deleteStep,
  deleteConfirmText,
  onConfirmTextChange,
  deleteError,
  onDeleteError,
  onDelete,
}: DeleteAccountDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Supprimer mon compte
          </DialogTitle>
          <DialogDescription className="text-left space-y-2 pt-1">
            <span className="block">
              Cette action est <strong>définitive et irréversible</strong>.
            </span>
            <span className="block">
              Vos données personnelles seront effacées et vos réservations futures annulées
              automatiquement. Vos réservations passées seront conservées de façon anonyme à des fins
              statistiques.
            </span>
          </DialogDescription>
        </DialogHeader>

        {deleteStep === 'confirm' && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm">
                Tapez{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">SUPPRIMER</code>{' '}
                pour confirmer
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => {
                  onConfirmTextChange(e.target.value);
                  onDeleteError(null);
                }}
                placeholder="SUPPRIMER"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            {deleteError && (
              <p role="alert" className="text-sm text-destructive">
                {deleteError}
              </p>
            )}
          </div>
        )}

        {deleteStep === 'deleting' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-8 h-8 animate-spin text-destructive" />
            <p className="text-sm text-muted-foreground">Suppression en cours…</p>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={deleteStep === 'deleting'}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            className="w-full sm:w-auto"
            disabled={deleteStep === 'deleting' || deleteConfirmText !== 'SUPPRIMER'}
          >
            {deleteStep === 'deleting' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
