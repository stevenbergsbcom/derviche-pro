'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { UserProfile, ProfileFormData, PasswordFormData } from '../components';

const EMPTY_PASSWORD: PasswordFormData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

/** Hook principal de la page Mon Compte — gère le chargement, la sauvegarde profil et le mot de passe */
export function useMonCompte() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState<PasswordFormData>(EMPTY_PASSWORD);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ----------------------------------------
  // CHARGEMENT DEPUIS SUPABASE
  // ----------------------------------------

  const loadUserData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, created_at')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single(),
      ]);

      if (profileResult.error) {
        logger.error('[AdminMonCompte] Erreur chargement profil', profileResult.error);
        return;
      }

      const profile = profileResult.data;
      if (roleResult.error) {
        logger.error('[AdminMonCompte] Erreur chargement rôle', roleResult.error);
      }
      const role = roleResult.data?.role ?? 'admin';

      const loaded: UserProfile = {
        id: profile.id,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || user.email || '',
        phone: profile.phone || '',
        role,
        createdAt: profile.created_at,
      };

      setUserData(loaded);
      setFormData({
        firstName: loaded.firstName,
        lastName: loaded.lastName,
        phone: loaded.phone,
      });
    } catch (err) {
      logger.error('[AdminMonCompte] Erreur inattendue', err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  // ----------------------------------------
  // SAUVEGARDE PROFIL
  // ----------------------------------------

  const handleSaveProfile = async () => {
    if (!userData) return;

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName.trim() || null,
          last_name: formData.lastName.trim() || null,
          phone: formData.phone.trim() || null,
        })
        .eq('id', userData.id);

      if (error) {
        toast.error('Erreur lors de la sauvegarde');
        logger.error('[AdminMonCompte] Erreur sauvegarde', error);
        return;
      }

      setUserData((prev) =>
        prev
          ? {
                ...prev,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                phone: formData.phone.trim(),
            }
          : null
      );
      setIsEditing(false);
      toast.success('Profil mis à jour');
    } catch (err) {
      logger.error('[AdminMonCompte] Erreur', err as Error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (userData) {
      setFormData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
      });
    }
    setIsEditing(false);
  };

  // ----------------------------------------
  // CHANGEMENT MOT DE PASSE
  // ----------------------------------------

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!passwordData.currentPassword) {
      setPasswordError('Le mot de passe actuel est requis');
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordError('Le nouveau mot de passe est requis');
      return;
    }
    if (passwordData.newPassword.length < 10) {
      setPasswordError('Le mot de passe doit contenir au moins 10 caractères');
      return;
    }
    if (!/[A-Z]/.test(passwordData.newPassword)) {
      setPasswordError('Le mot de passe doit contenir au moins une majuscule');
      return;
    }
    if (!/[a-z]/.test(passwordData.newPassword)) {
      setPasswordError('Le mot de passe doit contenir au moins une minuscule');
      return;
    }
    if (!/[0-9]/.test(passwordData.newPassword)) {
      setPasswordError('Le mot de passe doit contenir au moins un chiffre');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
      setPasswordError('Le nouveau mot de passe doit être différent de l\'actuel');
      return;
    }

    setIsChangingPassword(true);
    try {
      const verifyResponse = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordData.currentPassword }),
      });

      const verifyResult = await verifyResponse.json() as {
        success: boolean;
        valid?: boolean;
        error?: string;
      };

      if (!verifyResult.success) {
        setPasswordError(verifyResult.error || 'Erreur de vérification');
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

      setIsPasswordDialogOpen(false);
      setPasswordData(EMPTY_PASSWORD);
      toast.success('Mot de passe modifié avec succès');
    } catch (err) {
      logger.error('[AdminMonCompte] Erreur changement mdp', err as Error);
      setPasswordError('Une erreur est survenue');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelPassword = () => {
    setIsPasswordDialogOpen(false);
    setPasswordData(EMPTY_PASSWORD);
    setPasswordError(null);
  };

  return {
    // État
    isLoading,
    isSaving,
    isChangingPassword,
    userData,
    isEditing,
    isPasswordDialogOpen,
    formData,
    passwordData,
    passwordError,
    // Actions profil
    setFormData,
    setIsEditing,
    handleSaveProfile,
    handleCancelEdit,
    // Actions mot de passe
    setIsPasswordDialogOpen,
    setPasswordData,
    handleChangePassword,
    handleCancelPassword,
  };
}
