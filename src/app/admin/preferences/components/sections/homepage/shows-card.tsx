/**
 * SpectaclesCard — Section Spectacles de la homepage
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Theater } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsCard } from '../../shared';

import type { CardProps } from './types';

// ============================================
// SCHEMA
// ============================================

const spectaclesSchema = z.object({
  label: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300),
  cta_text: z.string().min(1).max(100),
});

type SpectaclesFormData = z.infer<typeof spectaclesSchema>;

// ============================================
// COMPONENT
// ============================================

export function SpectaclesCard({
  data,
  isLoading,
  isSaving,
  canEdit,
  onUpdate,
  onDirtyChange,
}: CardProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SpectaclesFormData>({
    resolver: zodResolver(spectaclesSchema),
    defaultValues: { label: '', title: '', subtitle: '', cta_text: '' },
  });

  useEffect(() => {
    if (data?.homepage_spectacles && !isInitialized) {
      reset(data.homepage_spectacles);
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    onDirtyChange(isDirty);
  }, [isDirty, isInitialized, onDirtyChange]);

  const onSubmit = async (formData: SpectaclesFormData) => {
    const result = await onUpdate({ homepage_spectacles: formData });
    if (result.success) {
      toast.success('Section Spectacles enregistrée');
      reset(formData);
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <SettingsCard
      icon={Theater}
      title="Spectacles"
      description="Titres et bouton de la section carousel"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="spectacles_label">Label</Label>
          <Input
            id="spectacles_label"
            placeholder="Sélection"
            disabled={!canEdit}
            {...register('label')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spectacles_title">Titre</Label>
          <Input
            id="spectacles_title"
            placeholder="Spectacles à découvrir"
            disabled={!canEdit}
            {...register('title')}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="spectacles_subtitle">Sous-titre</Label>
          <Input
            id="spectacles_subtitle"
            placeholder="Explorez les spectacles en tournée cette saison"
            disabled={!canEdit}
            {...register('subtitle')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spectacles_cta_text">Texte du bouton</Label>
          <Input
            id="spectacles_cta_text"
            placeholder="Voir tout le catalogue"
            disabled={!canEdit}
            {...register('cta_text')}
          />
          {errors.cta_text && (
            <p className="text-sm text-destructive">{errors.cta_text.message}</p>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}
