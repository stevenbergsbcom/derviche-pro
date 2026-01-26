/**
 * SlotItem - Item de créneau sélectionnable
 * Derviche Diffusion
 */

'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { formatSlotDate, formatSlotTime } from '@/lib/services/checkin';
import type { SlotItemProps } from '../types';
import { 
  getDisplayRemaining, 
  isSlotPast, 
  isSlotToday, 
  isSlotUnlimited,
  wouldCauseOverbooking,
} from '../helpers';

// ============================================
// COMPOSANT
// ============================================

export function SlotItem({ 
  slot, 
  isSelected, 
  onSelect, 
  numPlaces, 
  disabled 
}: SlotItemProps) {
  const isPast = isSlotPast(slot.date, slot.time);
  const isToday = isSlotToday(slot.date);
  const isUnlimited = isSlotUnlimited(slot);
  
  // Calculer si overbooking potentiel
  const wouldOverbook = wouldCauseOverbooking(slot, numPlaces);
  
  // Vérifier si l'invité a déjà une réservation sur ce créneau
  const hasExistingReservation = slot.hasExistingGuestReservation;
  
  // Désactiver si déjà réservé ou si disabled externe
  const isDisabled = disabled || hasExistingReservation;
  
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      role="option"
      aria-label={`${formatSlotDate(slot.date)} à ${formatSlotTime(slot.time)}${hasExistingReservation ? ' - Déjà réservé' : ''}`}
      aria-selected={isSelected}
      aria-disabled={isDisabled}
      className={cn(
        'w-full text-left p-4 rounded-lg border-2 transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
        isSelected
          ? 'border-primary bg-primary/5'
          : hasExistingReservation
            ? 'border-red-200 bg-red-50/50'
            : 'border-border hover:border-primary/50 hover:bg-muted/50',
        isDisabled && 'opacity-50 cursor-not-allowed',
        isPast && !isSelected && !hasExistingReservation && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Infos principales */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className={cn(
              'font-medium',
              isToday && 'text-primary',
              isPast && 'text-muted-foreground'
            )}>
              {formatSlotDate(slot.date)}
            </span>
            {isToday && (
              <Badge variant="default" className="text-sm">Aujourd&apos;hui</Badge>
            )}
            {isPast && !isToday && (
              <Badge variant="secondary" className="text-sm">Passé</Badge>
            )}
          </div>
          
          {/* Heure */}
          <div className="flex items-center gap-2 text-base text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{formatSlotTime(slot.time)}</span>
          </div>
          
          {/* Lieu */}
          <div className="flex items-center gap-2 text-base text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{slot.venue.name}</span>
            {slot.venue.city && (
              <span className="text-sm">({slot.venue.city})</span>
            )}
          </div>
        </div>

        {/* Indicateurs à droite */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Indicateur de sélection */}
          {isSelected && (
            <div 
              className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
              aria-hidden="true"
            >
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          
          {/* Places restantes */}
          <div className={cn(
            'flex items-center gap-1.5 text-base',
            wouldOverbook ? 'text-orange-600' : 'text-muted-foreground'
          )}>
            <Users className="w-4 h-4" aria-hidden="true" />
            <span className="font-medium">
              {getDisplayRemaining(slot)}
            </span>
            <span className="text-sm">
              {isUnlimited ? '' : 'restantes'}
            </span>
          </div>
          
          {/* Warning overbooking */}
          {wouldOverbook && !hasExistingReservation && (
            <div className="flex items-center gap-1 text-sm text-orange-600">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Surbooking</span>
            </div>
          )}
          
          {/* Indicateur déjà réservé */}
          {hasExistingReservation && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Déjà réservé</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
