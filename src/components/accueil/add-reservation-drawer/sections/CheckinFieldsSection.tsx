/**
 * CheckinFieldsSection - Champs de pointage immédiat (dépliable)
 * Derviche Diffusion - Session 82
 *
 * Statut de présence, Commentaire, Notes venue, Notes internes (admin)
 */

'use client';

import { MapPin, Lock, ChevronDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { STATUS_BUTTONS } from '@/components/accueil/checkin-drawer/constants';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { CheckinStatus } from '@/types/database';

import type { CheckinSectionProps } from '../types';

export function CheckinFieldsSection({
  form,
  isSubmitting,
  isOpen,
  onOpenChange,
}: CheckinSectionProps) {
  const { register, watch, setValue } = form;
  const checkinStatus = watch('checkinStatus');

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          aria-expanded={isOpen}
          aria-controls="checkin-fields-content"
        >
          <span className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
            Pointage immédiat (optionnel)
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
      <CollapsibleContent id="checkin-fields-content" className="space-y-4 pt-4">
        {/* Statut de présence — même style que le checkin-drawer */}
        <div className="space-y-2">
          <p className="text-base font-medium text-muted-foreground">
            Statut de présence
          </p>
          <div className="grid grid-cols-2 gap-3">
            {STATUS_BUTTONS.map((config) => {
              const Icon = config.icon;
              const isActive = checkinStatus === config.status;
              return (
                <button
                  key={config.status}
                  type="button"
                  onClick={() => setValue('checkinStatus', isActive ? undefined : config.status as CheckinStatus)}
                  disabled={isSubmitting}
                  aria-label={`Marquer comme ${config.label}`}
                  aria-pressed={isActive}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-4',
                    'rounded-xl border-2 transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    isActive
                      ? config.activeColor
                      : cn(config.bgColor, config.borderColor, config.color),
                    isSubmitting && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon className={cn('w-6 h-6', isActive && 'text-white')} aria-hidden="true" />
                  <span className={cn('text-base font-medium', isActive && 'text-white')}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Réinitialiser */}
          {checkinStatus && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setValue('checkinStatus', undefined)}
              disabled={isSubmitting}
              aria-label="Réinitialiser le statut de présence"
              className="mt-1 w-full text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Réinitialiser (non pointé)
            </Button>
          )}
        </div>

        {/* Notes accueil */}
        <div className="space-y-2">
          <Label htmlFor="checkinComment" className="text-base">
            Notes accueil
          </Label>
          <Textarea
            id="checkinComment"
            {...register('checkinComment')}
            placeholder="Note sur l'invité..."
            rows={3}
            disabled={isSubmitting}
            className="resize-none text-base"
          />
        </div>

        {/* Notes venue */}
        <div className="space-y-2">
          <Label htmlFor="checkinVenueNotes" className="text-base flex items-center gap-1.5">
            <MapPin className="w-4 h-4" aria-hidden="true" />
            Notes sur le lieu
          </Label>
          <Textarea
            id="checkinVenueNotes"
            {...register('checkinVenueNotes')}
            placeholder="Informations liées au lieu..."
            rows={3}
            disabled={isSubmitting}
            className="resize-none text-base"
          />
        </div>

        {/*
         * DÉCISION MÉTIER INTENTIONNELLE — Ne pas modifier sans validation.
         * Visible et modifiable par TOUT le staff DD (admin ET externe).
         * Jamais visible par les compagnies, même si elles font l'accueil.
         */}
        <div className="space-y-2">
          <Label
            htmlFor="checkinInternalNotes"
            className="text-base flex items-center gap-1.5"
          >
            <Lock className="w-4 h-4" aria-hidden="true" />
            Notes internes Derviche
            <Badge variant="outline" className="text-xs ml-1">
              Admin
            </Badge>
          </Label>
          <p className="text-xs text-muted-foreground">Non visibles par les compagnies</p>
          <Textarea
            id="checkinInternalNotes"
            {...register('checkinInternalNotes')}
            placeholder="Notes confidentielles..."
            rows={3}
            disabled={isSubmitting}
            className="resize-none text-base"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
