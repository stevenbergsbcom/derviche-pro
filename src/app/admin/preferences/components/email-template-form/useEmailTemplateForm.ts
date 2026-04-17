/**
 * useEmailTemplateForm — Hook de gestion du formulaire de template email
 * Derviche Diffusion - Admin Preferences
 *
 * Gère l'état du formulaire (react-hook-form + Zod), la soumission,
 * l'insertion de variables et les valeurs pour la preview.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { logger } from '@/lib/logger';
import type { EmailTemplate } from '@/types/email-templates';

import { templateFormSchema } from './schema';
import type { TemplateFormValues } from './schema';

interface UseEmailTemplateFormOptions {
  template: EmailTemplate;
  onDirtyChange?: (isDirty: boolean) => void;
  onSaved?: () => void;
}

export function useEmailTemplateForm({
  template,
  onDirtyChange,
  onSaved,
}: UseEmailTemplateFormOptions) {
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
    control,
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
      // CTA dervichediffusion.com — toggle + libellé (utilisé par les 4 post-checkin)
      show_derviche_site_link: template.show_derviche_site_link ?? false,
      derviche_site_link_text:
        template.derviche_site_link_text ?? 'Voir la fiche spectacle sur dervichediffusion.com',
      // Bloc « Gérer ma réservation »
      show_manage_reservation_link: template.show_manage_reservation_link ?? false,
      manage_reservation_link_text:
        template.manage_reservation_link_text ?? 'Annuler ou modifier ma réservation',
      guest_contact_message:
        template.guest_contact_message ??
        'Pour modifier ou annuler votre réservation, contactez-nous ci-dessous.',
    },
  });

  // Destructuration des refs RHF — une seule fois, avant le return.
  // Évite le double register() qui corromprait l'état interne de RHF.
  const { ref: subjectRhfRef, ...subjectRegisterProps } = register('subject');
  const { ref: introRhfRef,   ...introRegisterProps   } = register('intro_text');
  const { ref: bodyRhfRef,    ...bodyRegisterProps    } = register('body_text');
  const { ref: infoRhfRef,    ...infoRegisterProps    } = register('info_text');

  const showContactBlock    = useWatch({ control, name: 'show_contact_block' });
  const showFolderLink      = useWatch({ control, name: 'show_folder_link' });
  const showTeaserLink      = useWatch({ control, name: 'show_teaser_link' });
  const showCaptationLink   = useWatch({ control, name: 'show_captation_link' });
  const showBookingLink     = useWatch({ control, name: 'show_booking_link' });
  const showPhotoFolderLink = useWatch({ control, name: 'show_photo_folder_link' });
  const showDervicheSiteLink = useWatch({ control, name: 'show_derviche_site_link' });
  const showManageReservationLink = useWatch({ control, name: 'show_manage_reservation_link' });
  const showReservationCode = useWatch({ control, name: 'show_reservation_code' });
  const isConfirmation      = template.template_key === 'reservation_confirmation';
  const isSimpleStyle       = template.is_simple_style === true;
  /**
   * Templates dont le builder HTML utilise `template.show_derviche_site_link`
   * pour afficher un lien vers la page marketing dervichediffusion.com :
   *  - confirmation / modification / rappels J-7 / J-2 / H-4 : le toggle
   *    route le CTA principal vers l'URL externe (libellé = `cta_text`,
   *    sinon fiche publique interne)
   *  - 4 templates post-checkin : le toggle ajoute une entrée dans la liste
   *    des liens complémentaires (libellé = `derviche_site_link_text`,
   *    éditable par template depuis la migration 112)
   * Hors scope : cancellation (CTA catalogue), admin_notification (CTA admin).
   */
  const supportsDervicheSiteLink =
    template.template_key === 'reservation_confirmation' ||
    template.template_key === 'reservation_modification' ||
    template.template_key === 'reminder_7d' ||
    template.template_key === 'reminder_2d' ||
    template.template_key === 'reminder_4h' ||
    template.template_key === 'checkin_thank_you' ||
    template.template_key === 'checkin_loved' ||
    template.template_key === 'checkin_press' ||
    template.template_key === 'checkin_followup_absent';

  // Notifier le parent quand isDirty change
  useEffect(() => {
    onDirtyChangeRef.current?.(isDirty);
  }, [isDirty]);

  // Insérer une variable dans le dernier textarea/input focalisé
  const handleInsertVariable = useCallback((variable: string) => {
    const el = lastFocusedRef.current;
    if (!el) {
      const current = getValues('intro_text') ?? '';
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
      // CTA dervichediffusion.com — toggle + libellé custom (post-checkin, migration 112)
      show_derviche_site_link: v.show_derviche_site_link ?? false,
      derviche_site_link_text: v.derviche_site_link_text ?? '',
      // Bloc « Gérer ma réservation »
      show_manage_reservation_link: v.show_manage_reservation_link ?? false,
      manage_reservation_link_text: v.manage_reservation_link_text ?? '',
      guest_contact_message: v.guest_contact_message ?? '',
    };
  };

  // Props communes pour les champs avec insertion de variables
  const focusProps = (
    fieldName: keyof TemplateFormValues
  ) => ({
    onFocus: (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      lastFocusedRef.current = e.currentTarget;
    },
    'data-field': fieldName,
  });

  return {
    // Form state
    register,
    handleSubmit,
    setValue,
    errors,
    isDirty,
    isSaving,
    // Refs
    introRef,
    bodyRef,
    infoRef,
    subjectRef,
    // Register destructured props
    subjectRhfRef,
    subjectRegisterProps,
    introRhfRef,
    introRegisterProps,
    bodyRhfRef,
    bodyRegisterProps,
    infoRhfRef,
    infoRegisterProps,
    // Watched values
    showContactBlock,
    showFolderLink,
    showTeaserLink,
    showCaptationLink,
    showBookingLink,
    showPhotoFolderLink,
    showDervicheSiteLink,
    showManageReservationLink,
    showReservationCode,
    // Derived
    isConfirmation,
    supportsDervicheSiteLink,
    isSimpleStyle,
    // Preview
    previewOpen,
    setPreviewOpen,
    currentFormValues,
    // Handlers
    handleInsertVariable,
    onSubmit,
    focusProps,
  };
}
