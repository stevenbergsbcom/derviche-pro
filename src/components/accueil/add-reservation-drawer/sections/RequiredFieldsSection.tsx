/**
 * RequiredFieldsSection - Champs obligatoires du formulaire
 * Derviche Diffusion - Session 82
 *
 * Prénom, Nom, Email, Nombre de places
 */

'use client';

import { User, Mail, Users, Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { SectionProps } from '../types';

export function RequiredFieldsSection({ form, isSubmitting }: SectionProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
        Informations obligatoires
      </h3>

      {/* Prénom */}
      <div className="space-y-2">
        <Label htmlFor="firstName" className="text-base flex items-center gap-1.5">
          <User className="w-4 h-4" aria-hidden="true" />
          Prénom *
        </Label>
        <Input
          id="firstName"
          {...register('firstName')}
          placeholder="Jean"
          disabled={isSubmitting}
          className="h-12 text-base"
          aria-required="true"
          aria-invalid={!!errors.firstName}
          aria-describedby={errors.firstName ? 'firstName-error' : undefined}
        />
        {errors.firstName && (
          <p id="firstName-error" className="text-sm text-destructive" role="alert">
            {errors.firstName.message}
          </p>
        )}
      </div>

      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="lastName" className="text-base">Nom *</Label>
        <Input
          id="lastName"
          {...register('lastName')}
          placeholder="Dupont"
          disabled={isSubmitting}
          className="h-12 text-base"
          aria-required="true"
          aria-invalid={!!errors.lastName}
          aria-describedby={errors.lastName ? 'lastName-error' : undefined}
        />
        {errors.lastName && (
          <p id="lastName-error" className="text-sm text-destructive" role="alert">
            {errors.lastName.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-base flex items-center gap-1.5">
          <Mail className="w-4 h-4" aria-hidden="true" />
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="jean.dupont@theatre.fr"
          disabled={isSubmitting}
          className="h-12 text-base"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Nombre de places — stepper */}
      <div className="space-y-2">
        <Label className="text-base flex items-center gap-1.5">
          <Users className="w-4 h-4" aria-hidden="true" />
          Nombre de places *
        </Label>
        <div
          className="flex items-center gap-3"
          role="group"
          aria-label="Nombre de places"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const current = form.getValues('numPlaces');
              if (current > 1) form.setValue('numPlaces', current - 1, { shouldValidate: true });
            }}
            disabled={isSubmitting || (form.watch('numPlaces') ?? 1) <= 1}
            className="h-12 w-12 shrink-0 text-lg"
            aria-label="Enlever une place"
          >
            <Minus className="w-5 h-5" aria-hidden="true" />
          </Button>

          <div className="flex-1 flex flex-col items-center justify-center h-12 rounded-lg border-2 bg-muted/20">
            <span
              className="text-2xl font-bold tabular-nums leading-none"
              aria-live="polite"
              aria-atomic="true"
            >
              {form.watch('numPlaces') ?? 1}
            </span>
            <span className="text-xs text-muted-foreground">
              place{(form.watch('numPlaces') ?? 1) > 1 ? 's' : ''}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const current = form.getValues('numPlaces');
              if (current < 20) form.setValue('numPlaces', current + 1, { shouldValidate: true });
            }}
            disabled={isSubmitting || (form.watch('numPlaces') ?? 1) >= 20}
            className="h-12 w-12 shrink-0 text-lg"
            aria-label="Ajouter une place"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>

        {/* Input caché pour react-hook-form */}
        <input
          type="hidden"
          {...register('numPlaces', { valueAsNumber: true })}
        />

        {errors.numPlaces && (
          <p id="numPlaces-error" className="text-sm text-destructive" role="alert">
            {errors.numPlaces.message}
          </p>
        )}
      </div>
    </div>
  );
}
