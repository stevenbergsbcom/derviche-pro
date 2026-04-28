/**
 * Section Spectacle et Créneau du formulaire
 * Derviche Diffusion - Session 104
 */

'use client';

import { Calendar, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ShowSlotSectionProps } from '../types';
import { formatDateFr } from '../../reservation-helpers';
import { formatSlotLabel, isSlotFull } from '../utils';
import { LABELS } from '../constants';

export function ShowSlotSection({
  selectedShowId,
  onShowChange,
  publishedShows,
  slotId,
  onSlotChange,
  loadingSlots,
  slotsError,
  availableSlots,
  numPlaces,
  onNumPlacesChange,
  maxPlaces,
  disabled,
  slotIsPast = false,
}: ShowSlotSectionProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <h4 className="font-medium flex items-center gap-2">
        <Calendar className="w-4 h-4" aria-hidden="true" />
        {LABELS.sectionShowSlot}
      </h4>

      {/* Bandeau « créneau passé » : affiché quand le slot sélectionné a
          une heure antérieure à maintenant. La création reste possible —
          c'est juste une confirmation visuelle. */}
      {slotIsPast && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 p-3"
        >
          <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium">Cette représentation a déjà commencé</p>
            <p className="text-muted-foreground">
              L&apos;horaire du créneau sélectionné est passé. Une confirmation
              vous sera demandée avant la création de la réservation.
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4">
        {/* Sélection spectacle */}
        <div className="space-y-2">
          <Label htmlFor="show-select">{LABELS.show} *</Label>
          <Select 
            value={selectedShowId} 
            onValueChange={onShowChange}
            disabled={disabled}
          >
            <SelectTrigger id="show-select" aria-label="Sélectionner un spectacle">
              <SelectValue placeholder="Sélectionner un spectacle" />
            </SelectTrigger>
            <SelectContent>
              {publishedShows.length === 0 ? (
                <SelectItem value="_none" disabled>Aucun spectacle publié</SelectItem>
              ) : (
                publishedShows.map(show => (
                  <SelectItem key={show.id} value={show.id}>
                    {show.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Sélection créneau et nombre de places */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="slot-select">{LABELS.slot} *</Label>
            {renderSlotSelect()}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="num-places">
              {LABELS.numPlaces} * (max: {maxPlaces})
            </Label>
            <Input
              id="num-places"
              type="number"
              min={1}
              max={maxPlaces}
              value={numPlaces}
              onChange={(e) => onNumPlacesChange(parseInt(e.target.value, 10) || 1)}
              disabled={disabled || !slotId}
              aria-describedby="num-places-help"
            />
            <span id="num-places-help" className="sr-only">
              Nombre de places à réserver, maximum {maxPlaces}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Rendu conditionnel du select de créneaux
   */
  function renderSlotSelect() {
    if (!selectedShowId) {
      return (
        <p className="text-sm text-muted-foreground">
          Sélectionnez d&apos;abord un spectacle
        </p>
      );
    }

    if (loadingSlots) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Chargement des créneaux...
        </div>
      );
    }

    if (slotsError) {
      return (
        <div className="flex items-center gap-2 text-sm text-destructive" role="alert">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          {slotsError}
        </div>
      );
    }

    if (availableSlots.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Aucun créneau disponible
        </p>
      );
    }

    return (
      <Select
        value={slotId}
        onValueChange={onSlotChange}
        disabled={disabled}
      >
        <SelectTrigger id="slot-select" aria-label="Sélectionner un créneau">
          <SelectValue placeholder="Sélectionner un créneau" />
        </SelectTrigger>
        <SelectContent>
          {availableSlots.map(slot => (
            <SelectItem 
              key={slot.id} 
              value={slot.id}
              disabled={isSlotFull(slot)}
            >
              {formatSlotLabel(slot, formatDateFr)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
}
