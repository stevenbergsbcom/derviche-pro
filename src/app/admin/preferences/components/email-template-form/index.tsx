/**
 * EmailTemplateForm — Formulaire d'édition d'un template email
 * Derviche Diffusion - Admin Preferences
 *
 * Tous les champs éditables d'un template email,
 * avec badges variables cliquables et preview HTML.
 */

'use client';

import { Eye, Save, Loader2, AlertCircle, Type, Settings2, Link2 } from 'lucide-react';

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

import { EmailPreviewModal } from '../EmailPreviewModal';
import type { EmailTemplate } from '@/types/email-templates';

import { useEmailTemplateForm } from './useEmailTemplateForm';
import { VariableBadges } from './VariableBadges';
import { OptionalLinkToggle } from './OptionalLinkToggle';

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
// COMPOSANT PRINCIPAL
// ============================================

export function EmailTemplateForm({
  template,
  canEdit,
  onDirtyChange,
  onSaved,
}: EmailTemplateFormProps) {
  const {
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
    isSimpleStyle,
    // Preview
    previewOpen,
    setPreviewOpen,
    currentFormValues,
    // Handlers
    handleInsertVariable,
    onSubmit,
    focusProps,
  } = useEmailTemplateForm({ template, onDirtyChange, onSaved });

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

        {/* ── Variables (instance unique) ─────────────── */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
          <p className="text-xs text-muted-foreground">
            Cliquez sur une variable pour l&apos;insérer dans le dernier champ sélectionné.
          </p>
          <VariableBadges onInsert={handleInsertVariable} disabled={!canEdit} />
        </div>

        {/* ── Contenu ─────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Contenu
          </p>
        </div>

        {/* Objet */}
        <div className="space-y-1.5">
          <Label htmlFor={`subject-${template.template_key}`}>
            Objet de l&apos;email <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`subject-${template.template_key}`}
            {...subjectRegisterProps}
            {...focusProps('subject')}
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
          <Textarea
            id={`intro_text-${template.template_key}`}
            {...introRegisterProps}
            {...focusProps('intro_text')}
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
          <Textarea
            id={`body_text-${template.template_key}`}
            {...bodyRegisterProps}
            {...focusProps('body_text')}
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
            <Textarea
              id={`info_text-${template.template_key}`}
              {...infoRegisterProps}
              {...focusProps('info_text')}
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
          <div className="space-y-3">
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

            {/* Toggle : rediriger vers dervichediffusion.com — spécifique au
                template de confirmation (seul builder qui lit ce flag). */}
            {isConfirmation && (
              <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
                <Switch
                  id={`show_derviche_site_link-${template.template_key}`}
                  checked={showDervicheSiteLink}
                  onCheckedChange={(checked) =>
                    setValue('show_derviche_site_link', checked, { shouldDirty: true })
                  }
                  disabled={!canEdit}
                />
                <div className="flex-1 space-y-0.5">
                  <Label
                    htmlFor={`show_derviche_site_link-${template.template_key}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    Rediriger vers dervichediffusion.com
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Si activé et l&apos;URL est renseignée sur le spectacle, le
                    bouton pointe vers la page du site vitrine au lieu de la
                    fiche publique interne. Le libellé reste celui défini
                    ci-dessus.
                  </p>
                </div>
              </div>
            )}

            {/* Bloc « Gérer ma réservation » — CTA secondaire conditionnel
                compte pro / guest (seul le builder confirmation le lit). */}
            {isConfirmation && (
              <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
                <Switch
                  id={`show_manage_reservation_link-${template.template_key}`}
                  checked={showManageReservationLink}
                  onCheckedChange={(checked) =>
                    setValue('show_manage_reservation_link', checked, { shouldDirty: true })
                  }
                  disabled={!canEdit}
                />
                <div className="flex-1 space-y-2">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor={`show_manage_reservation_link-${template.template_key}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      Bloc « Gérer ma réservation »
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Ajoute après le CTA principal un bouton vers
                      «&nbsp;Mes réservations&nbsp;» (compte pro) ou un message
                      + bouton mailto (guest).
                    </p>
                  </div>
                  {showManageReservationLink && (
                    <div className="space-y-2 pt-2 border-t border-dashed">
                      <div className="space-y-1">
                        <Label
                          htmlFor={`manage_reservation_link_text-${template.template_key}`}
                          className="text-xs"
                        >
                          Libellé du bouton (compte pro)
                        </Label>
                        <Input
                          id={`manage_reservation_link_text-${template.template_key}`}
                          {...register('manage_reservation_link_text')}
                          disabled={!canEdit}
                          placeholder="Ex: Annuler ou modifier ma réservation"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor={`guest_contact_message-${template.template_key}`}
                          className="text-xs"
                        >
                          Message pour les réservations guest
                        </Label>
                        <Input
                          id={`guest_contact_message-${template.template_key}`}
                          {...register('guest_contact_message')}
                          disabled={!canEdit}
                          placeholder="Ex: Pour modifier ou annuler votre réservation, contactez-nous."
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Suivi d&apos;un bouton «&nbsp;Nous contacter&nbsp;»
                          (mailto:) avec l&apos;adresse de contact Derviche.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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

        {/* Liens optionnels — uniquement pour les templates style sobre (post-checkin) */}
        {isSimpleStyle && (
          <>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Liens optionnels
              </p>
            </div>
            <div className="space-y-3 rounded-lg border p-4">
              <OptionalLinkToggle
                templateKey={template.template_key}
                label="Lien dossier de presse"
                description="Affiché uniquement si l'URL est renseignée sur le spectacle"
                showFieldName="show_folder_link"
                textFieldName="folder_link_text"
                placeholder="Ex: Consulter le dossier de presse"
                isVisible={showFolderLink}
                onToggle={(checked) => setValue('show_folder_link', checked, { shouldDirty: true })}
                canEdit={canEdit}
                registerFn={register}
              />
              <OptionalLinkToggle
                templateKey={template.template_key}
                label="Lien teaser vidéo"
                description="Affiché uniquement si l'URL est renseignée sur le spectacle"
                showFieldName="show_teaser_link"
                textFieldName="teaser_link_text"
                placeholder="Ex: Voir le teaser vidéo"
                isVisible={showTeaserLink}
                onToggle={(checked) => setValue('show_teaser_link', checked, { shouldDirty: true })}
                canEdit={canEdit}
                registerFn={register}
              />
              <OptionalLinkToggle
                templateKey={template.template_key}
                label="Lien captation vidéo"
                description="Affiché uniquement si l'URL est renseignée sur le spectacle"
                showFieldName="show_captation_link"
                textFieldName="captation_link_text"
                placeholder="Ex: Voir la captation vidéo"
                isVisible={showCaptationLink}
                onToggle={(checked) => setValue('show_captation_link', checked, { shouldDirty: true })}
                canEdit={canEdit}
                registerFn={register}
              />
              <OptionalLinkToggle
                templateKey={template.template_key}
                label="Lien de réservation"
                description="Lien vers la page publique du spectacle (toujours disponible)"
                showFieldName="show_booking_link"
                textFieldName="booking_link_text"
                placeholder="Ex: Réserver une place pour ce spectacle"
                isVisible={showBookingLink}
                onToggle={(checked) => setValue('show_booking_link', checked, { shouldDirty: true })}
                canEdit={canEdit}
                registerFn={register}
              />
              <OptionalLinkToggle
                templateKey={template.template_key}
                label="Lien dossier photo"
                description="Affiché uniquement si l'URL est renseignée sur le spectacle"
                showFieldName="show_photo_folder_link"
                textFieldName="photo_folder_link_text"
                placeholder="Ex: Consulter le dossier photo"
                isVisible={showPhotoFolderLink}
                onToggle={(checked) => setValue('show_photo_folder_link', checked, { shouldDirty: true })}
                canEdit={canEdit}
                registerFn={register}
              />
            </div>
          </>
        )}

        {/* ── Options ──────────────────────────────── */}
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Options
          </p>
        </div>

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
              checked={showReservationCode}
              onCheckedChange={(checked) =>
                setValue('show_reservation_code', checked, { shouldDirty: true })
              }
              disabled={!canEdit}
            />
          </div>
        )}

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
