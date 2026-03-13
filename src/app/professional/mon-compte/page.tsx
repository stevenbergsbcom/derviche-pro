'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

import type {
  ProProfile,
  ProfileFormData,
  PasswordData,
  EditingSection,
  DeleteStep,
} from './types';
import { validatePassword } from './utils';
import {
  MonCompteSkeleton,
  PersonalSection,
  ProfessionalSection,
  AddressSection,
  SecuritySection,
  PasswordDialog,
  DeleteAccountDialog,
} from './components';

// ============================================
// PAGE
// ============================================

export default function ProfessionalMonComptePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [editingSection, setEditingSection] = useState<EditingSection>(null);

  // Dialog mot de passe
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Dialog suppression de compte (RGPD)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>('confirm');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    phone2: '',
    email2: '',
    organization: '',
    function: '',
    afcNumber: '',
    address: '',
    postalCode: '',
    city: '',
    country: '',
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // ----------------------------------------
  // CHARGEMENT
  // ----------------------------------------

  const loadProfile = useCallback(async () => {
    try {
      setLoadError(false);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, email, email2, first_name, last_name, phone, phone2, structure, function, afc_number, address, postal_code, city, country, created_at'
        )
        .eq('id', user.id)
        .single();

      if (error) {
        logger.error('[ProMonCompte] Erreur chargement profil', error);
        setLoadError(true);
        return;
      }

      const loaded: ProProfile = {
        id: data.id as string,
        email: (data.email as string | null) ?? user.email ?? '',
        email2: (data.email2 as string | null) ?? '',
        createdAt: data.created_at as string,
        firstName: (data.first_name as string | null) ?? '',
        lastName: (data.last_name as string | null) ?? '',
        phone: (data.phone as string | null) ?? '',
        phone2: (data.phone2 as string | null) ?? '',
        organization: (data.structure as string | null) ?? '',
        function: (data.function as string | null) ?? '',
        afcNumber: (data.afc_number as string | null) ?? '',
        address: (data.address as string | null) ?? '',
        postalCode: (data.postal_code as string | null) ?? '',
        city: (data.city as string | null) ?? '',
        country: (data.country as string | null) ?? 'France',
      };

      setProfile(loaded);
      setFormData({
        firstName: loaded.firstName,
        lastName: loaded.lastName,
        phone: loaded.phone,
        phone2: loaded.phone2,
        email2: loaded.email2,
        organization: loaded.organization,
        function: loaded.function,
        afcNumber: loaded.afcNumber,
        address: loaded.address,
        postalCode: loaded.postalCode,
        city: loaded.city,
        country: loaded.country,
      });
    } catch (err) {
      logger.error(
        '[ProMonCompte] Erreur inattendue',
        err instanceof Error ? err : new Error(String(err))
      );
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  // ----------------------------------------
  // CALLBACKS ENFANTS
  // ----------------------------------------

  const handleFormChange = useCallback((updates: Partial<ProfileFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handlePasswordDataChange = useCallback((updates: Partial<PasswordData>) => {
    setPasswordData((prev) => ({ ...prev, ...updates }));
  }, []);

  // ----------------------------------------
  // SAUVEGARDE PAR SECTION
  // ----------------------------------------

  const handleSave = async (section: NonNullable<EditingSection>) => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const supabase = createClient();
      const updates: Record<string, string | null> = {};

      if (section === 'personal') {
        updates.first_name = formData.firstName.trim() || null;
        updates.last_name = formData.lastName.trim() || null;
        updates.phone = formData.phone.trim() || null;
        updates.phone2 = formData.phone2.trim() || null;
        updates.email2 = formData.email2.trim() || null;
      } else if (section === 'professional') {
        updates.structure = formData.organization.trim() || null;
        updates.function = formData.function.trim() || null;
        updates.afc_number = formData.afcNumber.trim() || null;
      } else if (section === 'address') {
        updates.address = formData.address.trim() || null;
        updates.postal_code = formData.postalCode.trim() || null;
        updates.city = formData.city.trim() || null;
        updates.country = formData.country.trim() || 'France';
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);

      if (error) {
        logger.error('[ProMonCompte] Erreur sauvegarde', error);
        toast.error('Erreur lors de la sauvegarde');
        return;
      }

      setProfile((prev) => {
        if (!prev) return null;
        if (section === 'personal') {
          return {
            ...prev,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            phone: formData.phone.trim(),
            phone2: formData.phone2.trim(),
            email2: formData.email2.trim(),
          };
        }
        if (section === 'professional') {
          return {
            ...prev,
            organization: formData.organization.trim(),
            function: formData.function.trim(),
            afcNumber: formData.afcNumber.trim(),
          };
        }
        return {
          ...prev,
          address: formData.address.trim(),
          postalCode: formData.postalCode.trim(),
          city: formData.city.trim(),
          country: formData.country.trim() || 'France',
        };
      });

      setEditingSection(null);
      toast.success('Profil mis à jour');
    } catch (err) {
      logger.error(
        '[ProMonCompte] Erreur sauvegarde',
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error('Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = (section: NonNullable<EditingSection>) => {
    if (!profile) return;
    if (section === 'personal') {
      setFormData((prev) => ({
        ...prev,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        phone2: profile.phone2,
        email2: profile.email2,
      }));
    } else if (section === 'professional') {
      setFormData((prev) => ({
        ...prev,
        organization: profile.organization,
        function: profile.function,
        afcNumber: profile.afcNumber,
      }));
    } else if (section === 'address') {
      setFormData((prev) => ({
        ...prev,
        address: profile.address,
        postalCode: profile.postalCode,
        city: profile.city,
        country: profile.country,
      }));
    }
    setEditingSection(null);
  };

  // ----------------------------------------
  // CHANGEMENT MOT DE PASSE
  // ----------------------------------------

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

  const handleClosePasswordDialog = useCallback(() => {
    setIsPasswordDialogOpen(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError(null);
  }, []);

  // ----------------------------------------
  // SUPPRESSION DE COMPTE (RGPD Art. 17)
  // ----------------------------------------

  const handleOpenDeleteDialog = useCallback(() => {
    setDeleteConfirmText('');
    setDeleteError(null);
    setDeleteStep('confirm');
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    // Empêcher la fermeture pendant la suppression en cours
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

      // Succès — déconnexion puis redirection vers /login
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

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  if (isLoading) return <MonCompteSkeleton />;

  if (loadError || (!isLoading && !profile)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-derviche-dark">Mon compte</h1>
        <p className="text-muted-foreground">Impossible de charger vos informations.</p>
        <Button variant="outline" onClick={() => void loadProfile()}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!profile) return null;

  const sectionProps = {
    profile,
    formData,
    editingSection,
    isSaving,
    onFormChange: handleFormChange,
    onEdit: setEditingSection,
    onSave: handleSave,
    onCancelEdit: handleCancelEdit,
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-derviche-dark">Mon compte</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et professionnelles
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PersonalSection {...sectionProps} />
        <ProfessionalSection {...sectionProps} />
        <AddressSection {...sectionProps} />
        <SecuritySection
          profile={profile}
          onOpenPasswordDialog={() => setIsPasswordDialogOpen(true)}
        />
      </div>

      {/* Zone dangereuse */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Zone dangereuse
          </CardTitle>
          <CardDescription>Actions irréversibles sur votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="space-y-1">
              <p className="font-medium text-sm">Supprimer mon compte</p>
              <p className="text-xs text-muted-foreground">
                Supprime définitivement votre compte et toutes vos données personnelles. Vos
                réservations futures seront annulées. Cette action est irréversible.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0"
              onClick={handleOpenDeleteDialog}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={handleClosePasswordDialog}
        passwordData={passwordData}
        onPasswordDataChange={handlePasswordDataChange}
        passwordError={passwordError}
        isChangingPassword={isChangingPassword}
        onSubmit={() => void handleChangePassword()}
      />

      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        deleteStep={deleteStep}
        deleteConfirmText={deleteConfirmText}
        onConfirmTextChange={setDeleteConfirmText}
        deleteError={deleteError}
        onDeleteError={setDeleteError}
        onDelete={() => void handleDeleteAccount()}
      />
    </div>
  );
}
