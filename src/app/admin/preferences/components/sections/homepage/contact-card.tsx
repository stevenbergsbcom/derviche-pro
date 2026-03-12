/**
 * ContactCard — Section Contact de la homepage
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SettingsCard } from '../../shared';

import type { CardProps } from './types';

// ============================================
// SCHEMA
// ============================================

const contactSchema = z.object({
  label: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().max(500),
});

type ContactFormData = z.infer<typeof contactSchema>;

// ============================================
// COMPONENT
// ============================================

export function ContactCard({
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
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { label: '', title: '', description: '' },
  });

  useEffect(() => {
    if (data?.homepage_contact && !isInitialized) {
      reset(data.homepage_contact);
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    onDirtyChange(isDirty);
  }, [isDirty, isInitialized, onDirtyChange]);

  const onSubmit = async (formData: ContactFormData) => {
    const result = await onUpdate({ homepage_contact: formData });
    if (result.success) {
      toast.success('Section Contact enregistrée');
      reset(formData);
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <SettingsCard
      icon={MessageCircle}
      title="Contact"
      description="Titres de la section contact"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_label">Label</Label>
            <Input
              id="contact_label"
              placeholder="Contact"
              disabled={!canEdit}
              {...register('label')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_title">Titre</Label>
            <Input
              id="contact_title"
              placeholder="Nous contacter"
              disabled={!canEdit}
              {...register('title')}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_description">Description</Label>
          <Textarea
            id="contact_description"
            rows={2}
            placeholder="Une question ? Notre équipe..."
            disabled={!canEdit}
            {...register('description')}
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Les coordonnées affichées (email, téléphone, adresse) proviennent de
            l&apos;onglet <strong>Organisation</strong>.
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}
