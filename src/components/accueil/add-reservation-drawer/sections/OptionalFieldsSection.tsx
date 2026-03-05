/**
 * OptionalFieldsSection - Champs optionnels du formulaire (dépliable)
 * Derviche Diffusion - Session 82
 *
 * Téléphone, Structure, Fonction, AFC, Adresse, Demandes spéciales
 */

'use client';

import {
  Phone,
  Building2,
  Briefcase,
  CreditCard,
  MapPin,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { CollapsibleSectionProps } from '../types';

export function OptionalFieldsSection({
  form,
  isSubmitting,
  isOpen,
  onOpenChange,
}: CollapsibleSectionProps) {
  const { register } = form;

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          aria-expanded={isOpen}
          aria-controls="optional-fields-content"
        >
          <span className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
            Informations complémentaires
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent id="optional-fields-content" className="space-y-4 pt-4">
        {/* Téléphone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-base flex items-center gap-1.5">
            <Phone className="w-4 h-4" aria-hidden="true" />
            Téléphone
          </Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder="06 12 34 56 78"
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* Structure */}
        <div className="space-y-2">
          <Label htmlFor="organization" className="text-base flex items-center gap-1.5">
            <Building2 className="w-4 h-4" aria-hidden="true" />
            Structure
          </Label>
          <Input
            id="organization"
            {...register('organization')}
            placeholder="Théâtre Municipal"
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* Fonction */}
        <div className="space-y-2">
          <Label htmlFor="function" className="text-base flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" aria-hidden="true" />
            Fonction
          </Label>
          <Input
            id="function"
            {...register('function')}
            placeholder="Programmateur"
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* N° AFC */}
        <div className="space-y-2">
          <Label htmlFor="afcNumber" className="text-base flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" aria-hidden="true" />
            N° AFC
          </Label>
          <Input
            id="afcNumber"
            {...register('afcNumber')}
            placeholder="AFC-123456"
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* Email secondaire */}
        <div className="space-y-2">
          <Label htmlFor="emailSecondary" className="text-base">
            Email secondaire
          </Label>
          <Input
            id="emailSecondary"
            type="email"
            {...register('emailSecondary')}
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* Téléphone secondaire */}
        <div className="space-y-2">
          <Label htmlFor="phoneSecondary" className="text-base">
            Téléphone secondaire
          </Label>
          <Input
            id="phoneSecondary"
            type="tel"
            {...register('phoneSecondary')}
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* Adresse */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-base flex items-center gap-1.5">
            <MapPin className="w-4 h-4" aria-hidden="true" />
            Adresse
          </Label>
          <Input
            id="address"
            {...register('address')}
            placeholder="12 rue du Théâtre"
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* Code postal */}
        <div className="space-y-2">
          <Label htmlFor="postalCode" className="text-base">Code postal</Label>
          <Input
            id="postalCode"
            {...register('postalCode')}
            placeholder="75001"
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* Ville */}
        <div className="space-y-2">
          <Label htmlFor="city" className="text-base">Ville</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="Paris"
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* Pays */}
        <div className="space-y-2">
          <Label htmlFor="country" className="text-base">Pays</Label>
          <Input
            id="country"
            {...register('country')}
            placeholder="France"
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        {/* Demandes spéciales */}
        <div className="space-y-2">
          <Label htmlFor="specialRequests" className="text-base flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            Demandes spéciales
          </Label>
          <Textarea
            id="specialRequests"
            {...register('specialRequests')}
            placeholder="PMR, placement particulier..."
            rows={3}
            disabled={isSubmitting}
            className="resize-none text-base"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
