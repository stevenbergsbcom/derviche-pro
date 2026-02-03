/**
 * Section Email - Paramètres d'envoi des emails
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsCard } from '../shared';

import { useEmailSettings } from '@/hooks/useAppSettings';
import type { EmailSettings } from '@/lib/services/app-settings';

// ============================================
// VALIDATION SCHEMA
// ============================================

const emailSchema = z.object({
  email_from_name: z.string().min(1, 'Le nom est requis').max(100, 'Maximum 100 caractères'),
  email_from_address: z.string().email('Email invalide'),
});

type EmailFormData = z.infer<typeof emailSchema>;

// ============================================
// PROPS
// ============================================

interface EmailSectionProps {
  /** Utilisateur peut modifier (super-admin) */
  canEdit: boolean;
  /** Callback pour notifier le parent des changements non sauvegardés */
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// COMPONENT
// ============================================

export function EmailSection({ canEdit, onDirtyChange }: EmailSectionProps) {
  const { data, isLoading, isSaving, error, update } = useEmailSettings();
  const [hasChanges, setHasChanges] = useState(false);

  // Flag pour savoir si l'initialisation est faite
  const [isInitialized, setIsInitialized] = useState(false);

  // Ref pour la callback (évite les boucles infinies)
  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email_from_name: '',
      email_from_address: '',
    },
  });

  // Initialiser le formulaire quand les données arrivent (une seule fois)
  useEffect(() => {
    if (data && !isInitialized) {
      reset({
        email_from_name: data.email_from_name || '',
        email_from_address: data.email_from_address || '',
      });
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  // Suivre les changements seulement après initialisation
  useEffect(() => {
    if (!isInitialized) return;
    
    setHasChanges(isDirty);
    onDirtyChangeRef.current?.(isDirty);
  }, [isDirty, isInitialized]);

  // Soumission du formulaire
  const onSubmit = async (formData: EmailFormData) => {
    const cleanedData: Partial<EmailSettings> = {
      email_from_name: formData.email_from_name || null,
      email_from_address: formData.email_from_address || null,
    };

    const result = await update(cleanedData);

    if (result.success) {
      toast.success('Paramètres email enregistrés');
      setHasChanges(false);
      onDirtyChange?.(false);
    } else {
      toast.error(result.error || 'Erreur lors de la sauvegarde');
    }
  };

  // Erreur de chargement
  if (error) {
    return (
      <SettingsCard
        icon={Mail}
        title="Email"
        description="Configuration de l'expéditeur des emails"
        canEdit={false}
      >
        <p className="text-sm text-destructive">Erreur : {error}</p>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      icon={Mail}
      title="Email"
      description="Configuration de l'expéditeur pour les emails de confirmation et rappels"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={hasChanges}
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Nom de l'expéditeur */}
      <div className="space-y-2">
        <Label htmlFor="email_from_name">
          Nom de l&apos;expéditeur <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email_from_name"
          placeholder="Derviche Diffusion"
          disabled={!canEdit}
          {...register('email_from_name')}
        />
        {errors.email_from_name && (
          <p className="text-sm text-destructive">{errors.email_from_name.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Le nom qui apparaîtra comme expéditeur des emails
        </p>
      </div>

      {/* Adresse email de l'expéditeur */}
      <div className="space-y-2">
        <Label htmlFor="email_from_address">
          Adresse email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email_from_address"
          type="email"
          placeholder="noreply@derviche-diffusion.fr"
          disabled={!canEdit}
          {...register('email_from_address')}
        />
        {errors.email_from_address && (
          <p className="text-sm text-destructive">{errors.email_from_address.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          L&apos;adresse email utilisée pour envoyer les notifications
        </p>
      </div>
    </SettingsCard>
  );
}
