/**
 * FooterCard — Section Footer de la homepage
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PanelBottom, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SettingsCard } from '../../shared';

import type { CardProps } from './types';

// ============================================
// SCHEMA
// ============================================

const footerSchema = z.object({
  description: z.string().max(500),
  facebook_url: z.union([z.string().url('URL invalide'), z.literal('')]),
  instagram_url: z.union([z.string().url('URL invalide'), z.literal('')]),
  copyright_text: z.string().max(200),
});

type FooterFormData = z.infer<typeof footerSchema>;

// ============================================
// COMPONENT
// ============================================

export function FooterCard({
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
  } = useForm<FooterFormData>({
    resolver: zodResolver(footerSchema),
    defaultValues: {
      description: '',
      facebook_url: '',
      instagram_url: '',
      copyright_text: '',
    },
  });

  useEffect(() => {
    if (data?.homepage_footer && !isInitialized) {
      reset(data.homepage_footer);
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    onDirtyChange(isDirty);
  }, [isDirty, isInitialized, onDirtyChange]);

  const onSubmit = async (formData: FooterFormData) => {
    const result = await onUpdate({ homepage_footer: formData });
    if (result.success) {
      toast.success('Section Footer enregistrée');
      reset(formData);
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <SettingsCard
      icon={PanelBottom}
      title="Footer"
      description="Description, réseaux sociaux et copyright"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="footer_description">Description</Label>
          <Textarea
            id="footer_description"
            rows={2}
            placeholder="Agence de production et de diffusion..."
            disabled={!canEdit}
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="footer_facebook_url">URL Facebook</Label>
            <Input
              id="footer_facebook_url"
              type="url"
              placeholder="https://www.facebook.com/..."
              disabled={!canEdit}
              {...register('facebook_url')}
            />
            {errors.facebook_url && (
              <p className="text-sm text-destructive">{errors.facebook_url.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="footer_instagram_url">URL Instagram</Label>
            <Input
              id="footer_instagram_url"
              type="url"
              placeholder="https://www.instagram.com/..."
              disabled={!canEdit}
              {...register('instagram_url')}
            />
            {errors.instagram_url && (
              <p className="text-sm text-destructive">{errors.instagram_url.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="footer_copyright_text">Texte copyright</Label>
          <Input
            id="footer_copyright_text"
            placeholder="© {year} Derviche Diffusion. Tous droits réservés."
            disabled={!canEdit}
            {...register('copyright_text')}
          />
          <p className="text-xs text-muted-foreground">
            Utilisez <code className="bg-muted px-1 rounded">{'{year}'}</code> pour
            insérer l&apos;année courante automatiquement.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Les coordonnées du footer (email, adresse) proviennent de
            l&apos;onglet <strong>Organisation</strong>.
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}
