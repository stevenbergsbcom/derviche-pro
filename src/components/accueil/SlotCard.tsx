/**
 * SlotCard - Card d'une représentation
 * Derviche Diffusion
 * 
 * Affiche les informations d'une représentation avec compteurs
 * Interface mobile-first pour l'accueil sur place
 */

'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Users, ChevronRight } from 'lucide-react';
import { formatSlotTime, isSlotToday } from '@/lib/services/checkin';
import type { CheckinSlot } from '@/lib/services/checkin';

// ============================================
// TYPES
// ============================================

export interface SlotCardProps {
  /** Données du slot */
  slot: CheckinSlot;
  /** Handler au clic */
  onClick: () => void;
  /** Classes CSS additionnelles */
  className?: string;
}

// ============================================
// COMPOSANT
// ============================================

export function SlotCard({ slot, onClick, className }: SlotCardProps) {
  const isToday = isSlotToday(slot.date);
  const hasCheckedIn = slot.checkedInCount > 0;
  const allCheckedIn = slot.checkedInCount === slot.confirmedCount && slot.confirmedCount > 0;

  return (
    <Card
      className={cn(
        'overflow-hidden cursor-pointer transition-all py-0',
        'hover:shadow-md active:scale-[0.98]',
        'border border-gray-200 shadow-sm',
        isToday && 'ring-2 ring-gold/50 border-gold/30',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-3 px-3 py-2">
          {/* Heure */}
          <div
            className={cn(
              'w-16 h-16 rounded-lg flex flex-col items-center justify-center shrink-0',
              isToday ? 'bg-gold/10 text-gold' : 'bg-muted text-muted-foreground'
            )}
          >
            <Clock className="w-4 h-4 mb-0.5" />
            <span className="text-lg font-bold leading-none">
              {formatSlotTime(slot.time)}
            </span>
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            {/* Lieu */}
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{slot.venue.name}</span>
            </div>
            {slot.venue.city && (
              <p className="text-xs text-muted-foreground ml-[22px] truncate">
                {slot.venue.city}
              </p>
            )}

            {/* Compteurs */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span
                  className={cn(
                    'font-medium',
                    allCheckedIn && 'text-green-600',
                    hasCheckedIn && !allCheckedIn && 'text-amber-600'
                  )}
                >
                  {slot.checkedInCount}/{slot.confirmedCount}
                </span>
                <span className="text-muted-foreground text-xs">présents</span>
              </div>

              {/* Badge capacité */}
              {slot.capacity !== 999999 && (
                <Badge variant="outline" className="text-xs">
                  {slot.confirmedCount}/{slot.capacity} places
                </Badge>
              )}
            </div>
          </div>

          {/* Chevron */}
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </div>

        {/* Barre de progression (si check-in en cours) */}
        {slot.confirmedCount > 0 && (
          <div className="h-1 bg-gray-100">
            <div
              className={cn(
                'h-full transition-all duration-300',
                allCheckedIn ? 'bg-green-500' : 'bg-gold'
              )}
              style={{
                width: `${Math.round((slot.checkedInCount / slot.confirmedCount) * 100)}%`,
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// SKELETON
// ============================================

export function SlotCardSkeleton() {
  return (
    <Card className="overflow-hidden py-0 border border-gray-200 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-16 h-16 rounded-lg bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
