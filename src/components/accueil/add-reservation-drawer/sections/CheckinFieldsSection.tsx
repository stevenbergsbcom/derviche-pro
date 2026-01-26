/**
 * CheckinFieldsSection - Champs de pointage immédiat (dépliable)
 * Derviche Diffusion - Session 82
 *
 * Statut de présence, Commentaire, Notes venue, Notes internes (admin)
 */

'use client';

import { MapPin, Lock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { CheckinStatus } from '@/types/database';
import { STATUS_OPTIONS } from '../constants';
import type { CheckinSectionProps } from '../types';

export function CheckinFieldsSection({
  form,
  isSubmitting,
  isOpen,
  onOpenChange,
  isAdmin,
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
      <CollapsibleContent id="checkin-fields-content" className="space-y-3 pt-3">
        {/* Statut de présence */}
        <div className="space-y-1.5">
          <Label className="text-base">Statut de présence</Label>
          <Select
            value={checkinStatus || ''}
            onValueChange={(value) => setValue('checkinStatus', value as CheckinStatus)}
            disabled={isSubmitting}
          >
            <SelectTrigger aria-label="Sélectionner le statut de présence">
              <SelectValue placeholder="Non pointé" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <span className={cn('flex items-center gap-2', option.color)}>
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {option.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Commentaire check-in */}
        <div className="space-y-1.5">
          <Label htmlFor="checkinComment" className="text-base">
            Commentaire
          </Label>
          <Textarea
            id="checkinComment"
            {...register('checkinComment')}
            placeholder="Note sur l'invité..."
            rows={2}
            disabled={isSubmitting}
            className="resize-none"
          />
        </div>

        {/* Notes venue */}
        <div className="space-y-1.5">
          <Label htmlFor="checkinVenueNotes" className="text-base flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            Notes sur le lieu
          </Label>
          <Textarea
            id="checkinVenueNotes"
            {...register('checkinVenueNotes')}
            placeholder="Informations liées au lieu..."
            rows={2}
            disabled={isSubmitting}
            className="resize-none"
          />
        </div>

        {/* Notes internes - Admin uniquement */}
        {isAdmin && (
          <div className="space-y-1.5">
            <Label
              htmlFor="checkinInternalNotes"
              className="text-base flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              Notes internes Derviche
              <Badge variant="outline" className="text-xs ml-1">
                Admin
              </Badge>
            </Label>
            <Textarea
              id="checkinInternalNotes"
              {...register('checkinInternalNotes')}
              placeholder="Notes confidentielles..."
              rows={2}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
