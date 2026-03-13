/**
 * PasswordDialog — Dialog changement de mot de passe
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
import { Loader2 } from 'lucide-react';

import type { PasswordData } from '../types';

// ============================================
// PROPS
// ============================================

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  passwordData: PasswordData;
  onPasswordDataChange: (updates: Partial<PasswordData>) => void;
  passwordError: string | null;
  isChangingPassword: boolean;
  onSubmit: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function PasswordDialog({
  isOpen,
  onClose,
  passwordData,
  onPasswordDataChange,
  passwordError,
  isChangingPassword,
  onSubmit,
}: PasswordDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              onChange={(e) => onPasswordDataChange({ currentPassword: e.target.value })}
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
              onChange={(e) => onPasswordDataChange({ newPassword: e.target.value })}
              disabled={isChangingPassword}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 caractères avec majuscules, minuscules et chiffres
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => onPasswordDataChange({ confirmPassword: e.target.value })}
              disabled={isChangingPassword}
              autoComplete="new-password"
            />
          </div>
          {passwordError && (
            <p role="alert" className="text-sm text-destructive">
              {passwordError}
            </p>
          )}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={isChangingPassword}
          >
            Annuler
          </Button>
          <Button
            onClick={onSubmit}
            className="w-full sm:w-auto bg-derviche hover:bg-derviche-dark text-white"
            disabled={isChangingPassword}
          >
            {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Changer le mot de passe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
