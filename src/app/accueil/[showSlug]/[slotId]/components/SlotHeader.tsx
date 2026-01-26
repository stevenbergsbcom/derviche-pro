/**
 * SlotHeader - En-tête avec infos du slot et compteurs
 * Derviche Diffusion
 */

'use client';

import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSlotDate, formatSlotTime, isSlotToday } from '@/lib/services/checkin';
import type { SlotInfo } from '../types';

interface SlotHeaderProps {
  slotInfo: SlotInfo | null;
  confirmedCount: number;
  presentCount: number;
  isLoading: boolean;
}

export function SlotHeader({
  slotInfo,
  confirmedCount,
  presentCount,
  isLoading,
}: SlotHeaderProps) {
  if (isLoading || !slotInfo) {
    return (
      <div className="bg-white border-b px-4 py-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  const isToday = isSlotToday(slotInfo.date);

  return (
    <div className="bg-white border-b px-4 py-4">
      {/* Titre du spectacle */}
      <h2
        className="text-xl font-bold text-derviche-dark line-clamp-1"
        aria-label={`Spectacle : ${slotInfo.showTitle}`}
      >
        {slotInfo.showTitle}
      </h2>

      {/* Date, heure, lieu */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-base text-muted-foreground">
        <span
          className={`flex items-center gap-1 ${isToday ? 'text-gold font-medium' : ''}`}
        >
          <Calendar className="w-4 h-4" aria-hidden="true" />
          {isToday ? "Aujourd'hui" : formatSlotDate(slotInfo.date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" aria-hidden="true" />
          {formatSlotTime(slotInfo.time)}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-4 h-4" aria-hidden="true" />
          {slotInfo.venueName}
        </span>
      </div>

      {/* Compteur présents */}
      <Card className="mt-3 bg-gray-50 border-0 py-0">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              <span className="text-base text-muted-foreground">Présents</span>
            </div>
            <div className="text-right" aria-live="polite">
              <span className="text-2xl font-bold text-derviche-dark">
                {presentCount}
              </span>
              <span className="text-lg text-muted-foreground">
                /{confirmedCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
