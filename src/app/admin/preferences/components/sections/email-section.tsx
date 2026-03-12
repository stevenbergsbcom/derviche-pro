/**
 * Section Email - Paramètres d'envoi des emails
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Send, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SettingsCard } from '../shared';

import { useEmailSettings } from '@/hooks/useAppSettings';
import type { EmailSettings } from '@/lib/services/app-settings';

// ============================================
// VALIDATION SCHEMA
// ============================================

const emailSchema = z.object({
  email_from_name: z.string().min(1, 'Le nom est requis').max(100, 'Maximum 100 caractères'),
  email_from_address: z.string().email('Email invalide'),
  email_reply_to: z
    .string()
    .email('Email invalide')
    .optional()
    .nullable()
    .or(z.literal('')),
  email_signature: z
    .string()
    .max(200, 'Maximum 200 caractères')
    .optional()
    .nullable()
    .or(z.literal('')),
  email_footer_text: z
    .string()
    .max(300, 'Maximum 300 caractères')
    .optional()
    .nullable()
    .or(z.literal('')),
});

type EmailFormData = z.infer<typeof emailSchema>;

// ============================================
// VALEURS PAR DÉFAUT (miroir des fallbacks dans email.ts)
// ============================================

const DEFAULT_VALUES: EmailFormData = {
  email_from_name: '',
  email_from_address: '',
  email_reply_to: '',
  email_signature: "L'équipe Derviche Diffusion",
  email_footer_text: 'Derviche Diffusion — contact@derviche-pro.fr',
};

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
    control,
    formState: { errors, isDirty },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Valeurs surveillées pour l'aperçu en temps réel
  const watchedSignature = useWatch({ control, name: 'email_signature' });
  const watchedFooter = useWatch({ control, name: 'email_footer_text' });

  // Initialiser le formulaire quand les données arrivent (une seule fois)
  useEffect(() => {
    if (data && !isInitialized) {
      reset({
        email_from_name: data.email_from_name || '',
        email_from_address: data.email_from_address || '',
        email_reply_to: data.email_reply_to || '',
        email_signature: data.email_signature || DEFAULT_VALUES.email_signature,
        email_footer_text: data.email_footer_text || DEFAULT_VALUES.email_footer_text,
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
      email_reply_to: formData.email_reply_to || null,
      email_signature: formData.email_signature || null,
      email_footer_text: formData.email_footer_text || null,
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
      description="Personnalisez l'expéditeur, la signature et le pied de page des emails envoyés par la plateforme"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={hasChanges}
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* ── Expéditeur ─────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Expéditeur
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Nom de l'expéditeur */}
        <div className="space-y-2">
          <Label htmlFor="email_from_name">
            Nom <span className="text-destructive">*</span>
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
            Nom affiché dans la boîte de réception
          </p>
        </div>

        {/* Adresse email de l'expéditeur */}
        <div className="space-y-2">
          <Label htmlFor="email_from_address">
            Adresse d&apos;envoi <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email_from_address"
            type="email"
            placeholder="reservations@derviche-pro.fr"
            disabled={!canEdit}
            {...register('email_from_address')}
          />
          {errors.email_from_address && (
            <p className="text-sm text-destructive">{errors.email_from_address.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Doit être une adresse vérifiée dans Resend
          </p>
        </div>

        {/* Adresse de réponse */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email_reply_to">Adresse de réponse (Reply-To)</Label>
          <Input
            id="email_reply_to"
            type="email"
            placeholder="contact@derviche-pro.fr"
            disabled={!canEdit}
            {...register('email_reply_to')}
          />
          {errors.email_reply_to && (
            <p className="text-sm text-destructive">{errors.email_reply_to.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Adresse utilisée quand le destinataire clique sur &quot;Répondre&quot;. Si vide,
            l&apos;adresse d&apos;envoi est utilisée.
          </p>
        </div>
      </div>

      <Separator />

      {/* ── Contenu commun ─────────────────────────── */}
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Contenu commun
        </p>
      </div>

      {/* Signature */}
      <div className="space-y-2">
        <Label htmlFor="email_signature">Signature</Label>
        <Input
          id="email_signature"
          placeholder="L'équipe Derviche Diffusion"
          disabled={!canEdit}
          {...register('email_signature')}
        />
        {errors.email_signature && (
          <p className="text-sm text-destructive">{errors.email_signature.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Affiché en bas de chaque email avant le pied de page
        </p>
      </div>

      {/* Pied de page */}
      <div className="space-y-2">
        <Label htmlFor="email_footer_text">Pied de page</Label>
        <Textarea
          id="email_footer_text"
          placeholder="Derviche Diffusion — contact@derviche-pro.fr"
          rows={2}
          disabled={!canEdit}
          {...register('email_footer_text')}
        />
        {errors.email_footer_text && (
          <p className="text-sm text-destructive">{errors.email_footer_text.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Texte affiché dans la zone grise en bas de tous les emails
        </p>
      </div>

      {/* ── Aperçu ─────────────────────────────────── */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Aperçu
        </p>
        <div className="rounded-md border bg-background p-4 text-sm space-y-2">
          <p className="text-muted-foreground italic">[Contenu de l&apos;email...]</p>
          <Separator />
          <p className="text-foreground">
            {watchedSignature || 'Signature'}
          </p>
          <div className="border-t pt-2 mt-2">
            <p className="text-xs text-muted-foreground whitespace-pre-line">
              {watchedFooter || 'Pied de page'}
            </p>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
