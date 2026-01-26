/**
 * RequiredFieldsSection - Champs obligatoires du formulaire
 * Derviche Diffusion - Session 82
 *
 * Prénom, Nom, Email, Nombre de places
 */

'use client';

import { User, Mail, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SectionProps } from '../types';

export function RequiredFieldsSection({ form, isSubmitting }: SectionProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
        Informations obligatoires
      </h3>

      {/* Prénom / Nom */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-base flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" aria-hidden="true" />
            Prénom *
          </Label>
          <Input
            id="firstName"
            {...register('firstName')}
            placeholder="Jean"
            disabled={isSubmitting}
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
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-base">Nom *</Label>
          <Input
            id="lastName"
            {...register('lastName')}
            placeholder="Dupont"
            disabled={isSubmitting}
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
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-base flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" aria-hidden="true" />
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="jean.dupont@theatre.fr"
          disabled={isSubmitting}
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

      {/* Nombre de places */}
      <div className="space-y-1.5">
        <Label htmlFor="numPlaces" className="text-base flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" aria-hidden="true" />
          Nombre de places *
        </Label>
        <Input
          id="numPlaces"
          type="number"
          min={1}
          max={20}
          {...register('numPlaces', { valueAsNumber: true })}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={!!errors.numPlaces}
          aria-describedby={errors.numPlaces ? 'numPlaces-error' : undefined}
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
