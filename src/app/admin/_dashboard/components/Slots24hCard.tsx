/**
 * Slots24hCard - Admin Dashboard
 * Derviche Diffusion
 *
 * Créneaux ayant lieu dans les prochaines 24 heures.
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import type { Slot24h } from '@/lib/services/admin-dashboard';

// ============================================
// HELPERS
// ============================================

function formatSlotTime(time: string): string {
  return time.slice(0, 5); // "14:30:00" → "14:30"
}

function formatSlotDate(date: string, time: string): string {
  const now = new Date();

  // Même jour → juste l'heure
  const today = now.toISOString().split('T')[0];
  if (date === today) {
    return `Aujourd'hui ${formatSlotTime(time)}`;
  }

  // Lendemain
  return `Demain ${formatSlotTime(time)}`;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

interface Slots24hCardProps {
  slots: Slot24h[];
  isLoading: boolean;
}

export function Slots24hCard({ slots, isLoading }: Slots24hCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Clock className="h-4 w-4 text-derviche" />
          Créneaux dans les 24h
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucun créneau dans les prochaines 24 heures
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{slot.show_title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatSlotDate(slot.date, slot.time)}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {slot.venue_name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={slot.reservations_count > 0 ? 'default' : 'outline'}
                    className={
                      slot.reservations_count > 0
                        ? 'bg-derviche text-white text-xs h-6'
                        : 'text-xs h-6'
                    }
                  >
                    {slot.reservations_count} résa
                  </Badge>
                  <Link
                    href={`/accueil?slot=${slot.id}`}
                    className="text-xs text-derviche hover:underline font-medium"
                    aria-label={`Check-in pour ${slot.show_title}`}
                  >
                    Check-in →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
