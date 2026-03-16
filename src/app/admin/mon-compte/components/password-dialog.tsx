'use client';

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
import { Loader2 } from 'lucide-react';
import type { PasswordFormData } from './types';

interface PasswordDialogProps {
  /** Modale ouverte ou non */
  open: boolean;
  /** Callback de changement d'état d'ouverture */
  onOpenChange: (open: boolean) => void;
  /** Données du formulaire de mot de passe */
  passwordData: PasswordFormData;
  /** Callback de mise à jour des données du formulaire */
  onPasswordDataChange: (data: PasswordFormData) => void;
  /** Message d'erreur de validation */
  passwordError: string | null;
  /** Changement en cours */
  isChangingPassword: boolean;
  /** Callback de soumission du formulaire */
  onSubmit: () => void;
  /** Callback d'annulation (réinitialise le formulaire) */
  onCancel: () => void;
}

/** Modale de changement de mot de passe */
export function PasswordDialog({
  open,
  onOpenChange,
  passwordData,
  onPasswordDataChange,
  passwordError,
  isChangingPassword,
  onSubmit,
  onCancel,
}: PasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Changer le mot de passe</DialogTitle>
          <DialogDescription>
            Entrez votre mot de passe actuel et choisissez un nouveau mot de passe sécurisé.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                onPasswordDataChange({ ...passwordData, currentPassword: e.target.value })
              }
              disabled={isChangingPassword}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                onPasswordDataChange({ ...passwordData, newPassword: e.target.value })
              }
              disabled={isChangingPassword}
              autoComplete="new-password"
            />
            <p className="text-muted-foreground text-xs">
              Minimum 10 caractères avec majuscules, minuscules et chiffres
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                onPasswordDataChange({ ...passwordData, confirmPassword: e.target.value })
              }
              disabled={isChangingPassword}
              autoComplete="new-password"
            />
          </div>
          {passwordError && (
            <p className="text-destructive text-sm">{passwordError}</p>
          )}
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
            disabled={isChangingPassword}
          >
            Annuler
          </Button>
          <Button
            onClick={onSubmit}
            className="w-full bg-derviche hover:bg-derviche-light sm:w-auto"
            disabled={isChangingPassword}
          >
            {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Changer le mot de passe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
