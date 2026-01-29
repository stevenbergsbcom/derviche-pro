/**
 * Section Créneau et Places du formulaire d'édition
 * Derviche Diffusion - Session 111
 */

'use client';

import { Calendar, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatSlotOption } from '../utils';
import { LABELS, INFO_MESSAGES, PLACEHOLDERS, MIN_PLACES, MAX_PLACES } from '../constants';
import type { SlotPlacesSectionProps } from '../types';

export function SlotPlacesSection({
  slotId,
  numPlaces,
  availableSlots,
  loadingSlots,
  slotsError,
  onSlotChange,
  onNumPlacesChange,
  disabled,
}: SlotPlacesSectionProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <h4 className="font-medium flex items-center gap-2">
        <Calendar className="w-4 h-4" aria-hidden="true" />
        {LABELS.sectionSlotPlaces}
      </h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sélection du créneau */}
        <div className="space-y-2">
          <Label htmlFor="slot">{LABELS.slot}</Label>
          {loadingSlots ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              {INFO_MESSAGES.loadingSlots}
            </div>
          ) : slotsError ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              {slotsError}
            </div>
          ) : (
            <Select
              value={slotId}
              onValueChange={onSlotChange}
              disabled={disabled}
            >
              <SelectTrigger id="slot" aria-label={LABELS.slot}>
                <SelectValue placeholder={PLACEHOLDERS.selectSlot} />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot) => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {formatSlotOption(slot)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        {/* Nombre de places */}
        <div className="space-y-2">
          <Label htmlFor="numPlaces">{LABELS.numPlaces}</Label>
          <Input
            id="numPlaces"
            type="number"
            min={MIN_PLACES}
            max={MAX_PLACES}
            value={numPlaces}
            onChange={(e) => onNumPlacesChange(parseInt(e.target.value) || MIN_PLACES)}
            disabled={disabled}
            aria-label={LABELS.numPlaces}
          />
        </div>
      </div>
      
      {/* Note d'information */}
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <AlertCircle className="w-3 h-3" aria-hidden="true" />
        {INFO_MESSAGES.slotCapacityInfo}
      </p>
    </div>
  );
}
