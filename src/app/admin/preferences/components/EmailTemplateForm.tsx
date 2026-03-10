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
import { Eye, Save, Loader2, AlertCircle, Info } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  // Liens optionnels post-checkin (S149)
  show_folder_link:      z.boolean(),
  folder_link_text:      z.string().max(200),
  show_teaser_link:      z.boolean(),
  teaser_link_text:      z.string().max(200),
  show_captation_link:   z.boolean(),
  captation_link_text:   z.string().max(200),
  show_booking_link:     z.boolean(),
  booking_link_text:     z.string().max(200),
  // Dossier photo (S170)
  show_photo_folder_link: z.boolean(),
  photo_folder_link_text: z.string().max(200),
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

        {/* Icône ⓘ — popover avec toutes les variables */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center self-center ml-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Aide sur les variables disponibles"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-80 p-0">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-semibold">Variables disponibles</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cliquez sur un badge pour l&apos;insérer dans le champ actif.
              </p>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <tbody>
                  {EMAIL_TEMPLATE_VARIABLES.map((v) => (
                    <tr key={v.key} className="border-b last:border-0">
                      <td className="py-1.5 pr-3 font-mono text-primary whitespace-nowrap">
                        {v.key}
                      </td>
                      <td className="py-1.5 text-muted-foreground">
                        {v.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t bg-muted/30">
              <p className="text-[11px] text-muted-foreground">
                Certaines variables ne sont disponibles que sur certains types de templates.
              </p>
            </div>
          </PopoverContent>
        </Popover>

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

  // Refs DOM pour insérer les variables dans le champ focalisé
  const introRef       = useRef<HTMLTextAreaElement>(null);
  const bodyRef        = useRef<HTMLTextAreaElement>(null);
  const infoRef        = useRef<HTMLTextAreaElement>(null);
  const subjectRef     = useRef<HTMLInputElement>(null);
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
      // Liens optionnels post-checkin (S149)
      show_folder_link:      template.show_folder_link    ?? false,
      folder_link_text:      template.folder_link_text    ?? 'Consulter le dossier de presse',
      show_teaser_link:      template.show_teaser_link    ?? false,
      teaser_link_text:      template.teaser_link_text    ?? 'Voir le teaser vidéo',
      show_captation_link:   template.show_captation_link ?? false,
      captation_link_text:   template.captation_link_text ?? 'Voir la captation vidéo',
      show_booking_link:     template.show_booking_link   ?? false,
      booking_link_text:     template.booking_link_text   ?? 'Réserver une place pour ce spectacle',
      // Dossier photo (S170)
      show_photo_folder_link: template.show_photo_folder_link ?? false,
      photo_folder_link_text: template.photo_folder_link_text ?? 'Consulter le dossier photo',
    },
  });

  // Destructuration des refs RHF — une seule fois, avant le return.
  // Évite le double register() qui corromprait l'état interne de RHF.
  const { ref: subjectRhfRef, ...subjectRegisterProps } = register('subject');
  const { ref: introRhfRef,   ...introRegisterProps   } = register('intro_text');
  const { ref: bodyRhfRef,    ...bodyRegisterProps    } = register('body_text');
  const { ref: infoRhfRef,    ...infoRegisterProps    } = register('info_text');

  const showContactBlock = watch('show_contact_block');
  const isConfirmation   = template.template_key === 'reservation_confirmation';
  const isSimpleStyle    = template.is_simple_style === true;

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
      is_simple_style:       template.is_simple_style ?? false,
      // Liens optionnels post-checkin (S149)
      // On utilise ?? (pas ||) pour rester cohérent avec defaultValues :
      // si l'utilisateur vide un champ, la preview doit refléter ce vide.
      show_folder_link:      v.show_folder_link    ?? false,
      folder_link_text:      v.folder_link_text    ?? '',
      show_teaser_link:      v.show_teaser_link    ?? false,
      teaser_link_text:      v.teaser_link_text    ?? '',
      show_captation_link:   v.show_captation_link ?? false,
      captation_link_text:   v.captation_link_text ?? '',
      show_booking_link:     v.show_booking_link   ?? false,
      booking_link_text:     v.booking_link_text   ?? '',
      // Dossier photo (S170)
      show_photo_folder_link: v.show_photo_folder_link ?? false,
      photo_folder_link_text: v.photo_folder_link_text ?? '',
    };
  };

  // Props communes pour les champs avec insertion de variables
  const focusProps = (
    ref: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
    fieldName: keyof TemplateFormValues
  ) => ({
    onFocus: () => { lastFocusedRef.current = ref.current; },
    'data-field': fieldName,
  });

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Bandeau style sobre */}
        {isSimpleStyle && (
          <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
            <span className="text-xs text-blue-700">
              ✉️ Style sobre — cet email s&apos;envoie sans header graphique (fond blanc, ton personnel).
              Les champs non utilisés sont masqués.
            </span>
          </div>
        )}

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
            {...subjectRegisterProps}
            {...focusProps(subjectRef, 'subject')}
            ref={(el) => { subjectRhfRef(el); subjectRef.current = el; }}
            disabled={!canEdit}
            placeholder="Ex: Votre réservation est confirmée — {{organisation}}"
            className="font-mono text-sm"
          />
          {errors.subject && (
            <p className="text-xs text-destructive">{errors.subject.message}</p>
          )}
        </div>

        {/* Titre en-tête — masqué pour les templates style sobre */}
        {!isSimpleStyle && (
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
        )}

        {/* Intro text */}
        <div className="space-y-1.5">
          <Label htmlFor={`intro_text-${template.template_key}`}>
            Texte d&apos;introduction
          </Label>
          <VariableBadges onInsert={handleInsertVariable} disabled={!canEdit} />
          <Textarea
            id={`intro_text-${template.template_key}`}
            {...introRegisterProps}
            {...focusProps(introRef, 'intro_text')}
            ref={(el) => { introRhfRef(el); introRef.current = el; }}
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
            {...bodyRegisterProps}
            {...focusProps(bodyRef, 'body_text')}
            ref={(el) => { bodyRhfRef(el); bodyRef.current = el; }}
            disabled={!canEdit}
            rows={4}
            placeholder="Texte affiché après le récapitulatif."
            className="font-mono text-sm resize-none"
          />
          {errors.body_text && (
            <p className="text-xs text-destructive">{errors.body_text.message}</p>
          )}
        </div>

        {/* Info text — masqué pour les templates style sobre */}
        {!isSimpleStyle && (
          <div className="space-y-1.5">
            <Label htmlFor={`info_text-${template.template_key}`}>
              Bloc informatif
            </Label>
            <VariableBadges onInsert={handleInsertVariable} disabled={!canEdit} />
            <Textarea
              id={`info_text-${template.template_key}`}
              {...infoRegisterProps}
              {...focusProps(infoRef, 'info_text')}
              ref={(el) => { infoRhfRef(el); infoRef.current = el; }}
              disabled={!canEdit}
              rows={3}
              placeholder="Affiché dans un encadré jaune. Laisser vide pour masquer."
              className="font-mono text-sm resize-none"
            />
          </div>
        )}

        {/* CTA text — masqué pour les templates style sobre */}
        {!isSimpleStyle && (
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
        )}

        {/* Liens optionnels — uniquement pour les templates style sobre (post-checkin) */}
        {isSimpleStyle && (
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Liens optionnels
            </p>

            {/* Dossier de presse */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`show_folder_link-${template.template_key}`} className="text-sm font-medium">
                    Lien dossier de presse
                  </Label>
                  <p className="text-xs text-muted-foreground">Affiché uniquement si l&apos;URL est renseignée sur le spectacle</p>
                </div>
                <Switch
                  id={`show_folder_link-${template.template_key}`}
                  checked={watch('show_folder_link')}
                  onCheckedChange={(checked) => setValue('show_folder_link', checked, { shouldDirty: true })}
                  disabled={!canEdit}
                />
              </div>
              {watch('show_folder_link') && (
                <Input
                  {...register('folder_link_text')}
                  disabled={!canEdit}
                  placeholder="Ex: Consulter le dossier de presse"
                  className="text-sm"
                />
              )}
            </div>

            {/* Teaser vidéo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`show_teaser_link-${template.template_key}`} className="text-sm font-medium">
                    Lien teaser vidéo
                  </Label>
                  <p className="text-xs text-muted-foreground">Affiché uniquement si l&apos;URL est renseignée sur le spectacle</p>
                </div>
                <Switch
                  id={`show_teaser_link-${template.template_key}`}
                  checked={watch('show_teaser_link')}
                  onCheckedChange={(checked) => setValue('show_teaser_link', checked, { shouldDirty: true })}
                  disabled={!canEdit}
                />
              </div>
              {watch('show_teaser_link') && (
                <Input
                  {...register('teaser_link_text')}
                  disabled={!canEdit}
                  placeholder="Ex: Voir le teaser vidéo"
                  className="text-sm"
                />
              )}
            </div>

            {/* Captation vidéo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`show_captation_link-${template.template_key}`} className="text-sm font-medium">
                    Lien captation vidéo
                  </Label>
                  <p className="text-xs text-muted-foreground">Affiché uniquement si l&apos;URL est renseignée sur le spectacle</p>
                </div>
                <Switch
                  id={`show_captation_link-${template.template_key}`}
                  checked={watch('show_captation_link')}
                  onCheckedChange={(checked) => setValue('show_captation_link', checked, { shouldDirty: true })}
                  disabled={!canEdit}
                />
              </div>
              {watch('show_captation_link') && (
                <Input
                  {...register('captation_link_text')}
                  disabled={!canEdit}
                  placeholder="Ex: Voir la captation vidéo"
                  className="text-sm"
                />
              )}
            </div>

            {/* Lien de réservation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`show_booking_link-${template.template_key}`} className="text-sm font-medium">
                    Lien de réservation
                  </Label>
                  <p className="text-xs text-muted-foreground">Lien vers la page publique du spectacle (toujours disponible)</p>
                </div>
                <Switch
                  id={`show_booking_link-${template.template_key}`}
                  checked={watch('show_booking_link')}
                  onCheckedChange={(checked) => setValue('show_booking_link', checked, { shouldDirty: true })}
                  disabled={!canEdit}
                />
              </div>
              {watch('show_booking_link') && (
                <Input
                  {...register('booking_link_text')}
                  disabled={!canEdit}
                  placeholder="Ex: Réserver une place pour ce spectacle"
                  className="text-sm"
                />
              )}
            </div>

            {/* Dossier photo — S170 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`show_photo_folder_link-${template.template_key}`} className="text-sm font-medium">
                    Lien dossier photo
                  </Label>
                  <p className="text-xs text-muted-foreground">Affiché uniquement si l&apos;URL est renseignée sur le spectacle</p>
                </div>
                <Switch
                  id={`show_photo_folder_link-${template.template_key}`}
                  checked={watch('show_photo_folder_link')}
                  onCheckedChange={(checked) => setValue('show_photo_folder_link', checked, { shouldDirty: true })}
                  disabled={!canEdit}
                />
              </div>
              {watch('show_photo_folder_link') && (
                <Input
                  {...register('photo_folder_link_text')}
                  disabled={!canEdit}
                  placeholder="Ex: Consulter le dossier photo"
                  className="text-sm"
                />
              )}
            </div>
          </div>
        )}

        {/* Bloc de contact */}
        <div className="space-y-2 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={`show_contact_block-${template.template_key}`} className="text-sm font-medium">
                Bloc de contact
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
          {showContactBlock && (
            <Input
              id={`contact_block_title-${template.template_key}`}
              {...register('contact_block_title')}
              disabled={!canEdit}
              placeholder="Ex: Votre contact Derviche Diffusion"
              className="text-sm"
            />
          )}
        </div>

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

        {/* Formule de salutation */}
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
