/**
 * EmailTemplateForm — Formulaire d'édition d'un template email
 * Derviche Diffusion - Admin Preferences
 *
 * Tous les champs éditables d'un template email,
 * avec badges variables cliquables et preview HTML.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, Save, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { EmailPreviewModal } from './EmailPreviewModal';
import { logger } from '@/lib/logger';
import { EMAIL_TEMPLATE_VARIABLES } from '@/types/email-templates';
import type { EmailTemplate } from '@/types/email-templates';

// ============================================
// SCHÉMA ZOD
// ============================================

const templateFormSchema = z.object({
  subject:               z.string().min(1, "L'objet est requis").max(200),
  header_title:          z.string().max(100),
  salutation:            z.string().max(100),
  intro_text:            z.string().max(1000),
  body_text:             z.string().max(2000),
  info_text:             z.string().max(1000),
  cta_text:              z.string().max(100),
  contact_block_title:   z.string().max(100),
  show_contact_block:    z.boolean(),
  show_reservation_code: z.boolean(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

// ============================================
// PROPS
// ============================================

interface EmailTemplateFormProps {
  template: EmailTemplate;
  canEdit: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  onSaved?: () => void;
}

// ============================================
// SOUS-COMPOSANT — Badges variables cliquables
// ============================================

interface VariableBadgesProps {
  onInsert: (variable: string) => void;
  disabled: boolean;
}

function VariableBadges({ onInsert, disabled }: VariableBadgesProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="text-xs text-muted-foreground self-center mr-1">Variables :</span>
        {EMAIL_TEMPLATE_VARIABLES.map((v) => (
          <Tooltip key={v.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => !disabled && onInsert(v.key)}
                disabled={disabled}
                className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-mono
                           bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {v.key}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{v.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function EmailTemplateForm({
  template,
  canEdit,
  onDirtyChange,
  onSaved,
}: EmailTemplateFormProps) {
  const [isSaving, setIsSaving]       = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Refs pour insérer les variables dans le textarea focalisé
  const introRef   = useRef<HTMLTextAreaElement>(null);
  const bodyRef    = useRef<HTMLTextAreaElement>(null);
  const infoRef    = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const lastFocusedRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  // Ref pour la callback dirty (évite les boucles infinies)
  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => { onDirtyChangeRef.current = onDirtyChange; });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      subject:               template.subject               ?? '',
      header_title:          template.header_title          ?? '',
      salutation:            template.salutation            ?? '',
      intro_text:            template.intro_text            ?? '',
      body_text:             template.body_text             ?? '',
      info_text:             template.info_text             ?? '',
      cta_text:              template.cta_text              ?? '',
      contact_block_title:   template.contact_block_title   ?? '',
      show_contact_block:    template.show_contact_block    ?? false,
      show_reservation_code: template.show_reservation_code ?? false,
    },
  });

  const showContactBlock = watch('show_contact_block');
  const isConfirmation   = template.template_key === 'reservation_confirmation';

  // Notifier le parent quand isDirty change
  useEffect(() => {
    onDirtyChangeRef.current?.(isDirty);
  }, [isDirty]);

  // Insérer une variable dans le dernier textarea/input focalisé
  const handleInsertVariable = useCallback((variable: string) => {
    const el = lastFocusedRef.current;
    if (!el) {
      const current = getValues('intro_text');
      setValue('intro_text', current + variable, { shouldDirty: true });
      return;
    }

    const start  = el.selectionStart ?? el.value.length;
    const end    = el.selectionEnd   ?? el.value.length;
    const before = el.value.slice(0, start);
    const after  = el.value.slice(end);
    const newVal = before + variable + after;

    const fieldName = el.getAttribute('data-field') as keyof TemplateFormValues | null;
    if (fieldName) {
      setValue(fieldName, newVal, { shouldDirty: true });
      requestAnimationFrame(() => {
        const pos = start + variable.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    }
  }, [getValues, setValue]);

  // Soumission
  const onSubmit = async (values: TemplateFormValues) => {
    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/admin/email-templates/${template.template_key}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        }
      );
      const json = await res.json() as { success: boolean; error?: string };

      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Erreur lors de la sauvegarde');
        return;
      }

      toast.success('Template sauvegardé');
      reset(values);
      onSaved?.();
    } catch (error) {
      logger.error('EmailTemplateForm submit error', { error });
      toast.error('Erreur réseau — veuillez réessayer');
    } finally {
      setIsSaving(false);
    }
  };

  // Valeurs actuelles pour la preview
  const currentFormValues = (): Record<string, string | boolean> => {
    const v = getValues();
    return {
      subject:               v.subject               ?? '',
      header_title:          v.header_title          ?? '',
      salutation:            v.salutation            ?? '',
      intro_text:            v.intro_text            ?? '',
      body_text:             v.body_text             ?? '',
      info_text:             v.info_text             ?? '',
      cta_text:              v.cta_text              ?? '',
      contact_block_title:   v.contact_block_title   ?? '',
      show_contact_block:    v.show_contact_block    ?? false,
      show_reservation_code: v.show_reservation_code ?? false,
    };
  };

  const focusProps = (
    ref: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
    fieldName: string
  ) => ({
    onFocus: () => { lastFocusedRef.current = ref.current; },
    'data-field': fieldName,
  });

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Bandeau modifications non sauvegardées */}
        {isDirty && (
          <div role="alert" className="flex items-center gap-2 rounded-md bg-orange-50 border border-orange-200 px-3 py-2">
            <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
            <span className="text-xs text-orange-700">Modifications non sauvegardées</span>
          </div>
        )}

        {/* Objet */}
        <div className="space-y-1.5">
          <Label htmlFor={`subject-${template.template_key}`}>
            Objet de l&apos;email <span className="text-destructive">*</span>
          </Label>
          <VariableBadges onInsert={handleInsertVariable} disabled={!canEdit} />
          <Input
            id={`subject-${template.template_key}`}
            {...register('subject')}
            {...focusProps(subjectRef, 'subject')}
            ref={(el) => {
              (register('subject') as { ref: (el: HTMLInputElement | null) => void }).ref(el);
              (subjectRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
            }}
            disabled={!canEdit}
            placeholder="Ex: Votre réservation est confirmée — {{organisation}}"
            className="font-mono text-sm"
          />
          {errors.subject && (
            <p className="text-xs text-destructive">{errors.subject.message}</p>
          )}
        </div>

        {/* Titre en-tête */}
        <div className="space-y-1.5">
          <Label htmlFor={`header_title-${template.template_key}`}>
            Titre de l&apos;en-tête
          </Label>
          <Input
            id={`header_title-${template.template_key}`}
            {...register('header_title')}
            disabled={!canEdit}
            placeholder="Ex: Réservation confirmée ✓"
          />
        </div>

        {/* Intro text */}
        <div className="space-y-1.5">
          <Label htmlFor={`intro_text-${template.template_key}`}>
            Texte d&apos;introduction
          </Label>
          <VariableBadges onInsert={handleInsertVariable} disabled={!canEdit} />
          <Textarea
            id={`intro_text-${template.template_key}`}
            {...register('intro_text')}
            {...focusProps(introRef, 'intro_text')}
            ref={(el) => {
              (register('intro_text') as { ref: (el: HTMLTextAreaElement | null) => void }).ref(el);
              (introRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
            }}
            disabled={!canEdit}
            rows={3}
            placeholder="Texte affiché en début d'email."
            className="font-mono text-sm resize-none"
          />
          {errors.intro_text && (
            <p className="text-xs text-destructive">{errors.intro_text.message}</p>
          )}
        </div>

        {/* Body text */}
        <div className="space-y-1.5">
          <Label htmlFor={`body_text-${template.template_key}`}>
            Corps du message
          </Label>
          <VariableBadges onInsert={handleInsertVariable} disabled={!canEdit} />
          <Textarea
            id={`body_text-${template.template_key}`}
            {...register('body_text')}
            {...focusProps(bodyRef, 'body_text')}
            ref={(el) => {
              (register('body_text') as { ref: (el: HTMLTextAreaElement | null) => void }).ref(el);
              (bodyRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
            }}
            disabled={!canEdit}
            rows={4}
            placeholder="Texte affiché après le récapitulatif."
            className="font-mono text-sm resize-none"
          />
          {errors.body_text && (
            <p className="text-xs text-destructive">{errors.body_text.message}</p>
          )}
        </div>

        {/* Info text */}
        <div className="space-y-1.5">
          <Label htmlFor={`info_text-${template.template_key}`}>
            Bloc informatif
          </Label>
          <VariableBadges onInsert={handleInsertVariable} disabled={!canEdit} />
          <Textarea
            id={`info_text-${template.template_key}`}
            {...register('info_text')}
            {...focusProps(infoRef, 'info_text')}
            ref={(el) => {
              (register('info_text') as { ref: (el: HTMLTextAreaElement | null) => void }).ref(el);
              (infoRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
            }}
            disabled={!canEdit}
            rows={3}
            placeholder="Affiché dans un encadré jaune. Laisser vide pour masquer."
            className="font-mono text-sm resize-none"
          />
        </div>

        {/* CTA text */}
        <div className="space-y-1.5">
          <Label htmlFor={`cta_text-${template.template_key}`}>
            Texte du bouton d&apos;action
          </Label>
          <Input
            id={`cta_text-${template.template_key}`}
            {...register('cta_text')}
            disabled={!canEdit}
            placeholder="Ex: Voir le spectacle →"
          />
          <p className="text-xs text-muted-foreground">
            Laisser vide pour masquer le bouton.
          </p>
        </div>

        {/* Toggle show_contact_block */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor={`show_contact_block-${template.template_key}`} className="text-sm font-medium">
              Afficher le bloc de contact
            </Label>
            <p className="text-xs text-muted-foreground">
              Affiche les coordonnées du manager Derviche assigné au spectacle
            </p>
          </div>
          <Switch
            id={`show_contact_block-${template.template_key}`}
            checked={showContactBlock}
            onCheckedChange={(checked) =>
              setValue('show_contact_block', checked, { shouldDirty: true })
            }
            disabled={!canEdit}
          />
        </div>

        {/* Titre bloc contact (conditionnel) */}
        {showContactBlock && (
          <div className="space-y-1.5 pl-4 border-l-2 border-muted">
            <Label htmlFor={`contact_block_title-${template.template_key}`}>
              Titre du bloc de contact
            </Label>
            <Input
              id={`contact_block_title-${template.template_key}`}
              {...register('contact_block_title')}
              disabled={!canEdit}
              placeholder="Ex: Votre contact Derviche Diffusion"
            />
          </div>
        )}

        {/* Toggle show_reservation_code (confirmation uniquement) */}
        {isConfirmation && (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor={`show_reservation_code-${template.template_key}`} className="text-sm font-medium">
                Afficher le code de réservation
              </Label>
              <p className="text-xs text-muted-foreground">
                Affiche le code RES-XXXX en grand dans l&apos;email de confirmation
              </p>
            </div>
            <Switch
              id={`show_reservation_code-${template.template_key}`}
              checked={watch('show_reservation_code')}
              onCheckedChange={(checked) =>
                setValue('show_reservation_code', checked, { shouldDirty: true })
              }
              disabled={!canEdit}
            />
          </div>
        )}

        {/* ── Formule de salutation (juste avant les boutons = juste avant la signature) ── */}
        <div className="space-y-1.5">
          <Label htmlFor={`salutation-${template.template_key}`}>
            Formule de salutation
          </Label>
          <Input
            id={`salutation-${template.template_key}`}
            {...register('salutation')}
            disabled={!canEdit}
            placeholder="Ex: À très bientôt,"
          />
          <p className="text-xs text-muted-foreground">
            Affiché juste avant la signature. Laisser vide pour ne pas afficher.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewOpen(true)}
                    disabled={!canEdit}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Prévisualiser
                  </Button>
                </span>
              </TooltipTrigger>
              {!canEdit && (
                <TooltipContent>
                  <p className="text-xs">Réservé au super-admin</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!canEdit || isSaving || !isDirty}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canEdit && (
                <TooltipContent>
                  <p className="text-xs">Réservé au super-admin</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {!canEdit && (
            <Badge variant="secondary" className="text-xs">
              Lecture seule — super-admin uniquement
            </Badge>
          )}
        </div>
      </form>

      {/* Modal de preview */}
      <EmailPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        templateKey={template.template_key}
        templateName={template.name}
        formValues={currentFormValues()}
      />
    </>
  );
}
