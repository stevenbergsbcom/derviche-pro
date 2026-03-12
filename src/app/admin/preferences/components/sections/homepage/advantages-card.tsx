/**
 * AvantagesCard — Section Avantages de la homepage
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsCard } from '../../shared';

import type { CardProps } from './types';

// ============================================
// ICON OPTIONS
// ============================================

const ICON_OPTIONS = [
  { value: 'search', label: 'Recherche' },
  { value: 'calendar', label: 'Calendrier' },
  { value: 'message-circle', label: 'Message' },
  { value: 'star', label: 'Étoile' },
  { value: 'heart', label: 'Cœur' },
  { value: 'users', label: 'Utilisateurs' },
  { value: 'shield', label: 'Bouclier' },
  { value: 'zap', label: 'Éclair' },
] as const;

// ============================================
// SCHEMA
// ============================================

const avantageCardSchema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1, 'Le titre est requis').max(100),
  description: z.string().min(1, 'La description est requise').max(500),
});

const avantagesSchema = z.object({
  label: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  cards: z.array(avantageCardSchema).min(1).max(6),
});

type AvantagesFormData = z.infer<typeof avantagesSchema>;

// ============================================
// COMPONENT
// ============================================

export function AvantagesCard({
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
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AvantagesFormData>({
    resolver: zodResolver(avantagesSchema),
    defaultValues: {
      label: '',
      title: '',
      cards: [
        { icon: 'search', title: '', description: '' },
        { icon: 'calendar', title: '', description: '' },
        { icon: 'message-circle', title: '', description: '' },
      ],
    },
  });

  const { fields } = useFieldArray({ control, name: 'cards' });
  const watchedCards = useWatch({ control, name: 'cards' });

  useEffect(() => {
    if (data?.homepage_avantages && !isInitialized) {
      reset(data.homepage_avantages);
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    onDirtyChange(isDirty);
  }, [isDirty, isInitialized, onDirtyChange]);

  const onSubmit = async (formData: AvantagesFormData) => {
    const result = await onUpdate({ homepage_avantages: formData });
    if (result.success) {
      toast.success('Section Avantages enregistrée');
      reset(formData);
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <SettingsCard
      icon={Star}
      title="Avantages"
      description="Label, titre et cartes de la section plateforme"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="avantages_label">Label</Label>
            <Input
              id="avantages_label"
              placeholder="La plateforme"
              disabled={!canEdit}
              {...register('label')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avantages_title">Titre</Label>
            <Input
              id="avantages_title"
              placeholder="Simplifiez votre programmation"
              disabled={!canEdit}
              {...register('title')}
            />
          </div>
        </div>

        {fields.map((field, index) => {
          const watchedIcon = watchedCards?.[index]?.icon ?? field.icon;
          return (
            <div
              key={field.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <p className="text-sm font-medium text-muted-foreground">
                Carte {index + 1}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Icône</Label>
                  <Select
                    value={watchedIcon}
                    onValueChange={(val) =>
                      setValue(`cards.${index}.icon`, val, { shouldDirty: true })
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Titre</Label>
                  <Input
                    placeholder="Accès direct"
                    disabled={!canEdit}
                    {...register(`cards.${index}.title`)}
                  />
                  {errors.cards?.[index]?.title && (
                    <p className="text-sm text-destructive">
                      {errors.cards[index].title?.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  placeholder="Parcourez notre catalogue complet..."
                  disabled={!canEdit}
                  {...register(`cards.${index}.description`)}
                />
                {errors.cards?.[index]?.description && (
                  <p className="text-sm text-destructive">
                    {errors.cards[index].description?.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SettingsCard>
  );
}
