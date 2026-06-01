/**
 * Composant ProfessionalEditForm - Formulaire d'édition du profil
 * Derviche Diffusion
 *
 * Édition des champs du profil professionnel.
 * Utilise React Hook Form + Zod pour la validation.
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { CrmIdInput } from '@/components/admin/crm-id-input';
import type { ProfessionalEditFormProps, UpdateProfessionalData } from '@/app/admin/professionnels/types';
import { LABELS } from '@/app/admin/professionnels/constants';

// ============================================
// SCHÉMA DE VALIDATION
// Pas de .transform() pour éviter l'incompatibilité avec RHF.
// La normalisation '' → null est faite dans handleSubmit.
// ============================================

const schema = z.object({
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email2: z
    .string()
    .email('Email secondaire invalide')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone2: z.string().optional().nullable(),
  function: z.string().optional().nullable(),
  structure: z.string().optional().nullable(),
  afc_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  comments: z.string().optional().nullable(),
  // S174 — ID CRM Zoho (numérique uniquement, validation souple)
  crm_id: z
    .string()
    .regex(/^\d*$/, 'L\'ID CRM doit être composé uniquement de chiffres')
    .optional()
    .nullable(),
});

type FormValues = z.infer<typeof schema>;

/** Normalise les chaînes vides en null pour l'envoi à l'API */
function normalizeFormValues(values: FormValues): UpdateProfessionalData {
  const normalize = (v: string | null | undefined): string | null =>
    v && v.trim() !== '' ? v.trim() : null;

  return {
    first_name: normalize(values.first_name),
    last_name: normalize(values.last_name),
    phone: normalize(values.phone),
    email2: normalize(values.email2),
    phone2: normalize(values.phone2),
    function: normalize(values.function),
    structure: normalize(values.structure),
    afc_number: normalize(values.afc_number),
    address: normalize(values.address),
    postal_code: normalize(values.postal_code),
    city: normalize(values.city),
    country: normalize(values.country),
    comments: normalize(values.comments),
    crm_id: normalize(values.crm_id),
  };
}

// ============================================
// COMPOSANT
// ============================================

export function ProfessionalEditForm({
  professional,
  onSubmit,
  onCancel,
  isSubmitting,
  formError,
}: ProfessionalEditFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: professional.first_name ?? '',
      last_name: professional.last_name ?? '',
      phone: professional.phone ?? '',
      email2: professional.email2 ?? '',
      phone2: professional.phone2 ?? '',
      function: professional.function ?? '',
      structure: professional.structure ?? '',
      afc_number: professional.afc_number ?? '',
      address: professional.address ?? '',
      postal_code: professional.postal_code ?? '',
      city: professional.city ?? '',
      country: professional.country ?? '',
      comments: professional.comments ?? '',
      crm_id: professional.crm_id ?? '',
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(normalizeFormValues(values));
  });

  return (
    <Form {...form}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        {/* Erreur globale */}
        {formError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{formError}</p>
          </div>
        )}

        {/* ---- Informations personnelles ---- */}
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">
            Informations personnelles
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Prénom"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Nom"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ---- Informations professionnelles ---- */}
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">
            Informations professionnelles
          </p>
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="structure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Structure / Organisation</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Nom de la structure"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="function"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonction</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Ex: Directeur artistique"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="afc_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° AFC</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Numéro AFC"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* ---- Contact ---- */}
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">
            Contact
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="+33 6 00 00 00 00"
                        type="tel"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone secondaire</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="+33 6 00 00 00 00"
                        type="tel"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email secondaire</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="email@exemple.com"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ---- Adresse ---- */}
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">
            Adresse
          </p>
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rue</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Adresse postale"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code postal</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="75000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Paris"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="France"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* ---- ID CRM Zoho (S174) ---- */}
        <FormField
          control={form.control}
          name="crm_id"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <CrmIdInput
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? '')}
                  disabled={isSubmitting}
                  helpText="Identifiant du contact dans votre CRM Zoho (~17 chiffres). Optionnel — utilisé pour faire le pont avec votre CRM dans les exports."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ---- Notes internes ---- */}
        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes internes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Notes visibles uniquement par l'équipe Derviche…"
                  rows={3}
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ---- Actions ---- */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {LABELS.CANCEL}
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-derviche hover:bg-derviche/90 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? LABELS.SAVING : LABELS.SAVE}
          </Button>
        </div>
      </form>
    </Form>
  );
}
