/**
 * Hook des actions du compte — changement de mot de passe et suppression
 * Derviche Diffusion - Mon Compte professionnel
 */

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

import type { PasswordData, DeleteStep } from '../types';
import { validatePassword } from '../utils';

// ============================================
// HOOK
// ============================================

/** Gère le changement de mot de passe et la suppression du compte (RGPD) */
export function useMonCompteActions() {
  // --- Mot de passe ---
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // --- Suppression de compte ---
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>('confirm');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ----------------------------------------
  // Mot de passe
  // ----------------------------------------

  const handlePasswordDataChange = useCallback((updates: Partial<PasswordData>) => {
    setPasswordData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleClosePasswordDialog = useCallback(() => {
    setIsPasswordDialogOpen(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError(null);
  }, []);

  const handleChangePassword = async () => {
    setPasswordError(null);
    const error = validatePassword(passwordData);
    if (error) {
      setPasswordError(error);
      return;
    }

    setIsChangingPassword(true);
    try {
      const verifyResponse = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordData.currentPassword }),
      });

      if (!verifyResponse.ok) {
        setPasswordError('Erreur de communication avec le serveur');
        return;
      }

      const verifyResult = (await verifyResponse.json()) as {
        success: boolean;
        valid?: boolean;
        error?: string;
      };

      if (!verifyResult.success) {
        setPasswordError(verifyResult.error ?? 'Erreur de vérification');
        return;
      }
      if (!verifyResult.valid) {
        setPasswordError('Le mot de passe actuel est incorrect');
        return;
      }

      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) {
        setPasswordError(updateError.message);
        return;
      }

      handleClosePasswordDialog();
      toast.success('Mot de passe modifié avec succès');
    } catch (err) {
      logger.error(
        '[ProMonCompte] Erreur changement mdp',
        err instanceof Error ? err : new Error(String(err))
      );
      setPasswordError('Une erreur est survenue');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ----------------------------------------
  // Suppression de compte (RGPD Art. 17)
  // ----------------------------------------

  const handleOpenDeleteDialog = useCallback(() => {
    setDeleteConfirmText('');
    setDeleteError(null);
    setDeleteStep('confirm');
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    if (deleteStep === 'deleting') return;
    setIsDeleteDialogOpen(false);
    setDeleteConfirmText('');
    setDeleteError(null);
    setDeleteStep('confirm');
  }, [deleteStep]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      setDeleteError('Veuillez taper exactement « SUPPRIMER » pour confirmer.');
      return;
    }

    setDeleteError(null);
    setDeleteStep('deleting');

    try {
      const response = await fetch('/api/professional/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = (await response.json()) as { success: boolean; error?: string };

      if (!result.success) {
        logger.error('[ProMonCompte] Erreur suppression compte', { error: result.error });
        setDeleteError(result.error ?? 'Une erreur est survenue. Veuillez réessayer.');
        setDeleteStep('confirm');
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login?message=account_deleted';
    } catch (err) {
      logger.error(
        '[ProMonCompte] Exception suppression compte',
        err instanceof Error ? err : new Error(String(err))
      );
      setDeleteError('Une erreur inattendue est survenue. Veuillez réessayer.');
      setDeleteStep('confirm');
    }
  }, [deleteConfirmText]);

  return {
    // Mot de passe
    isPasswordDialogOpen,
    setIsPasswordDialogOpen,
    isChangingPassword,
    passwordError,
    passwordData,
    handlePasswordDataChange,
    handleClosePasswordDialog,
    handleChangePassword,
    // Suppression de compte
    isDeleteDialogOpen,
    deleteStep,
    deleteConfirmText,
    setDeleteConfirmText,
    deleteError,
    setDeleteError,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleDeleteAccount,
  };
}
