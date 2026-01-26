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
      <CollapsibleContent id="optional-fields-content" className="space-y-3 pt-3">
        {/* Téléphone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-base flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            Téléphone
          </Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder="06 12 34 56 78"
            disabled={isSubmitting}
          />
        </div>

        {/* Structure / Fonction */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="organization" className="text-base flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
              Structure
            </Label>
            <Input
              id="organization"
              {...register('organization')}
              placeholder="Théâtre Municipal"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="function" className="text-base flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
              Fonction
            </Label>
            <Input
              id="function"
              {...register('function')}
              placeholder="Programmateur"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* N° AFC */}
        <div className="space-y-1.5">
          <Label htmlFor="afcNumber" className="text-base flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
            N° AFC
          </Label>
          <Input
            id="afcNumber"
            {...register('afcNumber')}
            placeholder="AFC-123456"
            disabled={isSubmitting}
          />
        </div>

        {/* Email / Téléphone secondaires */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="emailSecondary" className="text-base">
              Email secondaire
            </Label>
            <Input
              id="emailSecondary"
              type="email"
              {...register('emailSecondary')}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phoneSecondary" className="text-base">
              Tél. secondaire
            </Label>
            <Input
              id="phoneSecondary"
              type="tel"
              {...register('phoneSecondary')}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Adresse */}
        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-base flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            Adresse
          </Label>
          <Input
            id="address"
            {...register('address')}
            placeholder="12 rue du Théâtre"
            disabled={isSubmitting}
          />
        </div>

        {/* CP / Ville */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="postalCode" className="text-base">
              Code postal
            </Label>
            <Input
              id="postalCode"
              {...register('postalCode')}
              placeholder="75001"
              disabled={isSubmitting}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="city" className="text-base">
              Ville
            </Label>
            <Input
              id="city"
              {...register('city')}
              placeholder="Paris"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Demandes spéciales */}
        <div className="space-y-1.5">
          <Label htmlFor="specialRequests" className="text-base flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            Demandes spéciales
          </Label>
          <Textarea
            id="specialRequests"
            {...register('specialRequests')}
            placeholder="PMR, placement particulier..."
            rows={2}
            disabled={isSubmitting}
            className="resize-none"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
