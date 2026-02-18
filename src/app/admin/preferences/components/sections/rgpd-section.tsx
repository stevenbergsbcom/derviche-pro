/**
 * Section RGPD - Paramètres de conservation des données
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsCard, InactiveSectionBanner } from '../shared';

import { useRgpdSettings } from '@/hooks/useAppSettings';
import type { RgpdSettings } from '@/lib/services/app-settings';

// ============================================
// VALIDATION SCHEMA
// ============================================

const rgpdSchema = z.object({
  rgpd_data_retention_months: z
    .number({ error: 'Nombre requis' })
    .min(1, 'Minimum 1 mois')
    .max(120, 'Maximum 120 mois (10 ans)'),
  rgpd_inactive_account_months: z
    .number({ error: 'Nombre requis' })
    .min(1, 'Minimum 1 mois')
    .max(120, 'Maximum 120 mois (10 ans)'),
});

type RgpdFormData = z.infer<typeof rgpdSchema>;

// ============================================
// PROPS
// ============================================

interface RgpdSectionProps {
  /** Utilisateur peut modifier (super-admin) */
  canEdit: boolean;
  /** Callback pour notifier le parent des changements non sauvegardés */
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// COMPONENT
// ============================================

export function RgpdSection({ canEdit, onDirtyChange }: RgpdSectionProps) {
  const { data, isLoading, isSaving, error, update } = useRgpdSettings();
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
  } = useForm<RgpdFormData>({
    resolver: zodResolver(rgpdSchema),
    defaultValues: {
      rgpd_data_retention_months: 36,
      rgpd_inactive_account_months: 24,
    },
  });

  // Initialiser le formulaire quand les données arrivent (une seule fois)
  useEffect(() => {
    if (data && !isInitialized) {
      reset({
        rgpd_data_retention_months: data.rgpd_data_retention_months,
        rgpd_inactive_account_months: data.rgpd_inactive_account_months,
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
  const onSubmit = async (formData: RgpdFormData) => {
    const cleanedData: Partial<RgpdSettings> = {
      rgpd_data_retention_months: formData.rgpd_data_retention_months,
      rgpd_inactive_account_months: formData.rgpd_inactive_account_months,
    };

    const result = await update(cleanedData);

    if (result.success) {
      toast.success('Paramètres RGPD enregistrés');
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
        icon={Shield}
        title="RGPD"
        description="Conservation des données personnelles"
        canEdit={false}
      >
        <p className="text-sm text-destructive">Erreur : {error}</p>
      </SettingsCard>
    );
  }

  return (
    <div className="space-y-4">
    <InactiveSectionBanner message="Les durées de conservation sont sauvegardées mais aucune purge automatique n'est encore implémentée. Ces valeurs seront utilisées lors de l'activation du job de purge RGPD." />
    <SettingsCard
      icon={Shield}
      title="RGPD"
      description="Paramètres de conservation et suppression des données personnelles"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={hasChanges}
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Durée de conservation des données */}
      <div className="space-y-2">
        <Label htmlFor="rgpd_data_retention_months">
          Durée de conservation des données <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="rgpd_data_retention_months"
            type="number"
            min={1}
            max={120}
            className="w-24"
            disabled={!canEdit}
            {...register('rgpd_data_retention_months', { valueAsNumber: true })}
          />
          <span className="text-sm text-muted-foreground">mois</span>
        </div>
        {errors.rgpd_data_retention_months && (
          <p className="text-sm text-destructive">{errors.rgpd_data_retention_months.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Durée pendant laquelle les réservations et données associées sont conservées après la
          représentation.
        </p>
      </div>

      {/* Durée avant suppression compte inactif */}
      <div className="space-y-2">
        <Label htmlFor="rgpd_inactive_account_months">
          Compte inactif <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="rgpd_inactive_account_months"
            type="number"
            min={1}
            max={120}
            className="w-24"
            disabled={!canEdit}
            {...register('rgpd_inactive_account_months', { valueAsNumber: true })}
          />
          <span className="text-sm text-muted-foreground">mois</span>
        </div>
        {errors.rgpd_inactive_account_months && (
          <p className="text-sm text-destructive">{errors.rgpd_inactive_account_months.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Durée d&apos;inactivité après laquelle un compte utilisateur peut être supprimé
          automatiquement.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Important :</strong> Ces paramètres doivent être conformes à votre politique de
        confidentialité et aux réglementations RGPD en vigueur.
      </div>
    </SettingsCard>
    </div>
  );
}
