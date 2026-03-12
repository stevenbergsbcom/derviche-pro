/**
 * ImpactCard — Section Chiffres clés de la homepage
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SettingsCard } from '../../shared';

import type { CardProps } from './types';

// ============================================
// SCHEMA
// ============================================

const statCardSchema = z.object({
  number: z.string().min(1, 'Le nombre est requis').max(20),
  label: z.string().min(1, 'Le label est requis').max(100),
});

const impactSchema = z.object({
  enabled: z.boolean(),
  label: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  stats: z.array(statCardSchema).min(1).max(6),
});

type ImpactFormData = z.infer<typeof impactSchema>;

// ============================================
// COMPONENT
// ============================================

export function ImpactCard({ data, isLoading, isSaving, canEdit, onUpdate, onDirtyChange }: CardProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ImpactFormData>({
    resolver: zodResolver(impactSchema),
    defaultValues: {
      enabled: true,
      label: '',
      title: '',
      description: '',
      stats: [
        { number: '', label: '' },
        { number: '', label: '' },
        { number: '', label: '' },
      ],
    },
  });

  const { fields } = useFieldArray({ control, name: 'stats' });
  const enabledValue = useWatch({ control, name: 'enabled' });

  useEffect(() => {
    if (data?.homepage_impact && !isInitialized) {
      reset(data.homepage_impact);
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    onDirtyChange(isDirty);
  }, [isDirty, isInitialized, onDirtyChange]);

  const onSubmit = async (formData: ImpactFormData) => {
    const result = await onUpdate({ homepage_impact: formData });
    if (result.success) {
      toast.success('Section Chiffres clés enregistrée');
      reset(formData);
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <SettingsCard
      icon={BarChart3}
      title="Chiffres clés"
      description="Statistiques et texte de la section impact"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label>Afficher la section</Label>
            <p className="text-sm text-muted-foreground">
              Affiche la section chiffres clés sur la page d&apos;accueil
            </p>
          </div>
          <Switch
            checked={enabledValue}
            onCheckedChange={(v) => setValue('enabled', v, { shouldDirty: true })}
            disabled={!canEdit}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="impact_label">Label</Label>
            <Input
              id="impact_label"
              placeholder="Notre impact"
              disabled={!canEdit}
              {...register('label')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="impact_title">Titre</Label>
            <Input
              id="impact_title"
              placeholder="Les chiffres qui parlent..."
              disabled={!canEdit}
              {...register('title')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="impact_description">Description</Label>
          <Textarea
            id="impact_description"
            rows={3}
            placeholder="Depuis 2016, Derviche rassemble..."
            disabled={!canEdit}
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Statistique {index + 1}
              </p>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  placeholder="120"
                  disabled={!canEdit}
                  {...register(`stats.${index}.number`)}
                />
                {errors.stats?.[index]?.number && (
                  <p className="text-sm text-destructive">
                    {errors.stats[index].number?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  placeholder="Spectacles représentés"
                  disabled={!canEdit}
                  {...register(`stats.${index}.label`)}
                />
                {errors.stats?.[index]?.label && (
                  <p className="text-sm text-destructive">
                    {errors.stats[index].label?.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SettingsCard>
  );
}
