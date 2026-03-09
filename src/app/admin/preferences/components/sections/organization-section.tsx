/**
 * Section Organisation - Paramètres de l'organisation
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SettingsCard } from '../shared';

import { useOrganizationSettings, useSeasonSettings } from '@/hooks/useAppSettings';
import type { OrganizationSettings, SeasonSettings } from '@/lib/services/app-settings';

// ============================================
// VALIDATION SCHEMA
// ============================================

const organizationSchema = z.object({
  organization_name: z.string().min(1, 'Le nom est requis').max(100, 'Maximum 100 caractères'),
  organization_logo_url: z.string().url('URL invalide').optional().nullable().or(z.literal('')),
  organization_contact_email: z
    .string()
    .email('Email invalide')
    .optional()
    .nullable()
    .or(z.literal('')),
  organization_contact_phone: z
    .string()
    .max(20, 'Maximum 20 caractères')
    .optional()
    .nullable()
    .or(z.literal('')),
  organization_address: z
    .string()
    .max(500, 'Maximum 500 caractères')
    .optional()
    .nullable()
    .or(z.literal('')),
  organization_website: z
    .string()
    .url('URL invalide (ex: https://derviche-diffusion.fr)')
    .optional()
    .nullable()
    .or(z.literal('')),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

// Regex MM-DD
const MM_DD_REGEX = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

const seasonSchema = z.object({
  season_start: z
    .string()
    .regex(MM_DD_REGEX, 'Format MM-JJ requis (ex: 09-01)'),
  season_end: z
    .string()
    .regex(MM_DD_REGEX, 'Format MM-JJ requis (ex: 06-30)'),
});

type SeasonFormData = z.infer<typeof seasonSchema>;

// ============================================
// PROPS
// ============================================

interface OrganizationSectionProps {
  /** Utilisateur peut modifier (super-admin) */
  canEdit: boolean;
  /** Callback pour notifier le parent des changements non sauvegardés */
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// COMPONENT
// ============================================

export function OrganizationSection({ canEdit, onDirtyChange }: OrganizationSectionProps) {
  const { data, isLoading, isSaving, error, update } = useOrganizationSettings();
  const {
    data: seasonData,
    isLoading: isSeasonLoading,
    isSaving: isSeasonSaving,
    update: updateSeason,
  } = useSeasonSettings();
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
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organization_name: '',
      organization_logo_url: '',
      organization_contact_email: '',
      organization_contact_phone: '',
      organization_address: '',
      organization_website: '',
    },
  });

  // Initialiser le formulaire quand les données arrivent
  useEffect(() => {
    if (data && !isInitialized) {
      reset({
        organization_name: data.organization_name || '',
        organization_logo_url: data.organization_logo_url || '',
        organization_contact_email: data.organization_contact_email || '',
        organization_contact_phone: data.organization_contact_phone || '',
        organization_address: data.organization_address || '',
        organization_website: data.organization_website || '',
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

  // Formulaire saison
  const {
    register: registerSeason,
    handleSubmit: handleSubmitSeason,
    reset: resetSeason,
    formState: { errors: seasonErrors, isDirty: isSeasonDirty },
  } = useForm<SeasonFormData>({
    resolver: zodResolver(seasonSchema),
    defaultValues: { season_start: '09-01', season_end: '06-30' },
  });

  // Initialiser le formulaire saison
  useEffect(() => {
    if (seasonData) {
      resetSeason({
        season_start: seasonData.season_start,
        season_end: seasonData.season_end,
      });
    }
  }, [seasonData, resetSeason]);

  // Soumission saison
  const onSubmitSeason = async (formData: SeasonFormData) => {
    const result = await updateSeason(formData as Partial<SeasonSettings>);
    if (result.success) {
      toast.success('Saison enregistrée');
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  // Soumission du formulaire
  const onSubmit = async (formData: OrganizationFormData) => {
    const cleanedData: Partial<OrganizationSettings> = {
      organization_name: formData.organization_name || null,
      organization_logo_url: formData.organization_logo_url || null,
      organization_contact_email: formData.organization_contact_email || null,
      organization_contact_phone: formData.organization_contact_phone || null,
      organization_address: formData.organization_address || null,
      organization_website: formData.organization_website || null,
    };

    const result = await update(cleanedData);

    if (result.success) {
      toast.success('Paramètres enregistrés');
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
        icon={Building2}
        title="Organisation"
        description="Informations de votre organisation"
        canEdit={false}
      >
        <p className="text-sm text-destructive">Erreur : {error}</p>
      </SettingsCard>
    );
  }

  return (
    <>
    <SettingsCard
      icon={Building2}
      title="Organisation"
      description="Informations générales affichées sur la plateforme"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={hasChanges}
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Nom de l'organisation */}
      <div className="space-y-2">
        <Label htmlFor="organization_name">
          Nom de l&apos;organisation <span className="text-destructive">*</span>
        </Label>
        <Input
          id="organization_name"
          placeholder="Derviche Diffusion"
          disabled={!canEdit}
          {...register('organization_name')}
        />
        {errors.organization_name && (
          <p className="text-sm text-destructive">{errors.organization_name.message}</p>
        )}
      </div>

      {/* URL du logo */}
      <div className="space-y-2">
        <Label htmlFor="organization_logo_url">URL du logo</Label>
        <Input
          id="organization_logo_url"
          type="url"
          placeholder="https://example.com/logo.png"
          disabled={!canEdit}
          {...register('organization_logo_url')}
        />
        {errors.organization_logo_url && (
          <p className="text-sm text-destructive">{errors.organization_logo_url.message}</p>
        )}
      </div>

      {/* Email de contact */}
      <div className="space-y-2">
        <Label htmlFor="organization_contact_email">Email de contact</Label>
        <Input
          id="organization_contact_email"
          type="email"
          placeholder="contact@derviche-diffusion.fr"
          disabled={!canEdit}
          {...register('organization_contact_email')}
        />
        {errors.organization_contact_email && (
          <p className="text-sm text-destructive">{errors.organization_contact_email.message}</p>
        )}
      </div>

      {/* Téléphone de contact */}
      <div className="space-y-2">
        <Label htmlFor="organization_contact_phone">Téléphone de contact</Label>
        <Input
          id="organization_contact_phone"
          type="tel"
          placeholder="+33 1 23 45 67 89"
          disabled={!canEdit}
          {...register('organization_contact_phone')}
        />
        {errors.organization_contact_phone && (
          <p className="text-sm text-destructive">{errors.organization_contact_phone.message}</p>
        )}
      </div>

      {/* Adresse postale */}
      <div className="space-y-2">
        <Label htmlFor="organization_address">Adresse postale</Label>
        <Textarea
          id="organization_address"
          placeholder="123 rue du Théâtre&#10;75001 Paris"
          rows={3}
          disabled={!canEdit}
          {...register('organization_address')}
        />
        {errors.organization_address && (
          <p className="text-sm text-destructive">{errors.organization_address.message}</p>
        )}
      </div>

      {/* Site web */}
      <div className="space-y-2">
        <Label htmlFor="organization_website">Site web</Label>
        <Input
          id="organization_website"
          type="url"
          placeholder="https://derviche-diffusion.fr"
          disabled={!canEdit}
          {...register('organization_website')}
        />
        {errors.organization_website && (
          <p className="text-sm text-destructive">{errors.organization_website.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          URL complète incluant https://
        </p>
      </div>
    </SettingsCard>

    {/* Saison du dashboard */}
    <SettingsCard
      icon={Building2}
      title="Saison du dashboard"
      description="Période utilisée pour le filtre ‘Saison’ du tableau de bord"
      isLoading={isSeasonLoading}
      isSaving={isSeasonSaving}
      canEdit={canEdit}
      hasChanges={isSeasonDirty}
      onSubmit={handleSubmitSeason(onSubmitSeason)}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="season_start">Début de saison</Label>
          <Input
            id="season_start"
            placeholder="09-01"
            disabled={!canEdit}
            {...registerSeason('season_start')}
          />
          {seasonErrors.season_start && (
            <p className="text-sm text-destructive">{seasonErrors.season_start.message}</p>
          )}
          <p className="text-xs text-muted-foreground">Format MM-JJ (ex : 09-01 = 1er septembre)</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="season_end">Fin de saison</Label>
          <Input
            id="season_end"
            placeholder="06-30"
            disabled={!canEdit}
            {...registerSeason('season_end')}
          />
          {seasonErrors.season_end && (
            <p className="text-sm text-destructive">{seasonErrors.season_end.message}</p>
          )}
          <p className="text-xs text-muted-foreground">Format MM-JJ (ex : 06-30 = 30 juin)</p>
        </div>
      </div>
    </SettingsCard>
    </>
  );
}
