/**
 * Card spectacle cliquable
 * Derviche Diffusion - PWA Check-in
 */

import { useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ChevronRight, Theater } from 'lucide-react';
import { formatSlotDate, formatSlotTime, isSlotToday } from '@/lib/services/checkin';
import type { ShowCardProps } from '../types';

/**
 * Card spectacle affichant les informations principales
 * et la prochaine/dernière représentation selon le mode
 */
export function ShowCard({ show, displayMode, onClick }: ShowCardProps) {
  // Déterminer quel slot afficher selon le mode
  const displaySlot = displayMode === 'upcoming' ? show.nextSlot : show.lastSlot;
  const slotsCount = displayMode === 'upcoming' ? show.upcomingSlotsCount : show.pastSlotsCount;
  const isToday = displaySlot && isSlotToday(displaySlot.date);

  // Label accessible pour la card (mémorisé)
  const ariaLabel = useMemo(() => {
    const base = `${show.title} par ${show.company.name}, ${slotsCount} représentation${slotsCount > 1 ? 's' : ''}`;
    if (!displaySlot) return base;
    const slotInfo = `${displayMode === 'upcoming' ? 'prochaine' : 'dernière'} le ${formatSlotDate(displaySlot.date)} à ${formatSlotTime(displaySlot.time)}`;
    return `${base}, ${slotInfo}`;
  }, [show.title, show.company.name, slotsCount, displaySlot, displayMode]);

  return (
    <Card
      className="overflow-hidden py-0 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="p-0">
        <div className="flex gap-3 pr-3">
          {/* Image - prend toute la hauteur */}
          <div className="w-24 rounded-l-xl overflow-hidden bg-muted shrink-0 relative self-stretch">
            {show.imageUrl ? (
              <Image
                src={show.imageUrl}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
                aria-hidden="true"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Theater className="w-8 h-8 text-muted-foreground/50" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0 py-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-lg leading-tight">{show.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {show.company.name}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
            </div>

            {/* Représentation affichée (prochaine ou dernière selon le mode) */}
            {displaySlot && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
                  <span className={isToday ? 'font-semibold text-gold' : ''}>
                    {isToday ? "Aujourd'hui" : formatSlotDate(displaySlot.date)}
                  </span>
                  <span className="text-muted-foreground" aria-hidden="true">•</span>
                  <span className="font-medium">{formatSlotTime(displaySlot.time)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="truncate">{displaySlot.venueName}</span>
                </div>
              </div>
            )}

            {/* Badge nombre de représentations */}
            <div className="mt-2">
              <Badge variant="secondary" className="text-sm">
                {slotsCount} représentation{slotsCount > 1 ? 's' : ''}
              </Badge>
              {isToday && displayMode === 'upcoming' && (
                <Badge variant="default" className="text-sm ml-1 bg-gold text-derviche-dark">
                  Aujourd&apos;hui
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
