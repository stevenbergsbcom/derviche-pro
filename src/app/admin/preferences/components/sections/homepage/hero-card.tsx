/**
 * HeroCard — Section Hero de la homepage
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Megaphone } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SettingsCard } from '../../shared';

import type { CardProps } from './types';

// ============================================
// SCHEMA
// ============================================

const heroSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(500),
  description: z.string().min(1, 'La description est requise').max(1000),
  secondary_text: z.string().max(500),
  cta_primary_text: z.string().min(1, 'Le texte du bouton est requis').max(100),
  cta_primary_url: z.string().min(1, 'L\'URL est requise').max(200),
  cta_secondary_text: z.string().max(100),
  cta_secondary_url: z.string().max(200),
});

type HeroFormData = z.infer<typeof heroSchema>;

// ============================================
// COMPONENT
// ============================================

export function HeroCard({ data, isLoading, isSaving, canEdit, onUpdate, onDirtyChange }: CardProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<HeroFormData>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      title: '',
      description: '',
      secondary_text: '',
      cta_primary_text: '',
      cta_primary_url: '',
      cta_secondary_text: '',
      cta_secondary_url: '',
    },
  });

  useEffect(() => {
    if (data?.homepage_hero && !isInitialized) {
      reset(data.homepage_hero);
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    onDirtyChange(isDirty);
  }, [isDirty, isInitialized, onDirtyChange]);

  const onSubmit = async (formData: HeroFormData) => {
    const result = await onUpdate({ homepage_hero: formData });
    if (result.success) {
      toast.success('Section Hero enregistrée');
      reset(formData);
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <SettingsCard
      icon={Megaphone}
      title="Hero"
      description="Titre, description et boutons d'action de la section principale"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hero_title">Titre</Label>
          <Textarea
            id="hero_title"
            rows={2}
            placeholder="Découvrez les spectacles..."
            disabled={!canEdit}
            {...register('title')}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          <p className="text-xs text-muted-foreground">
            Utilisez \n pour un retour à la ligne
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hero_description">Description</Label>
          <Textarea
            id="hero_description"
            rows={3}
            placeholder="Derviche est une agence..."
            disabled={!canEdit}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hero_secondary_text">Texte secondaire</Label>
          <Input
            id="hero_secondary_text"
            placeholder="Comme les derviches tourneurs..."
            disabled={!canEdit}
            {...register('secondary_text')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hero_cta_primary_text">Bouton principal — texte</Label>
            <Input
              id="hero_cta_primary_text"
              placeholder="Réserver ma place"
              disabled={!canEdit}
              {...register('cta_primary_text')}
            />
            {errors.cta_primary_text && (
              <p className="text-sm text-destructive">{errors.cta_primary_text.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_cta_primary_url">Bouton principal — URL</Label>
            <Input
              id="hero_cta_primary_url"
              placeholder="/catalogue"
              disabled={!canEdit}
              {...register('cta_primary_url')}
            />
            {errors.cta_primary_url && (
              <p className="text-sm text-destructive">{errors.cta_primary_url.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hero_cta_secondary_text">Bouton secondaire — texte</Label>
            <Input
              id="hero_cta_secondary_text"
              placeholder="Découvrir la plateforme"
              disabled={!canEdit}
              {...register('cta_secondary_text')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_cta_secondary_url">Bouton secondaire — URL</Label>
            <Input
              id="hero_cta_secondary_url"
              placeholder="#avantages"
              disabled={!canEdit}
              {...register('cta_secondary_url')}
            />
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
