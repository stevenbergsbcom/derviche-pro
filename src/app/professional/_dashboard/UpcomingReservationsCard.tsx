/**
 * UpcomingReservationsCard — Dashboard Professionnel
 * Derviche Diffusion
 *
 * Liste des 3 prochaines réservations confirmées avec lien "Voir tout".
 */

'use client';

import Link from 'next/link';
import { CalendarDays, MapPin, ArrowRight, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProUpcomingReservation } from '@/lib/services/pro-dashboard';

// ============================================
// HELPERS
// ============================================

function formatDate(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

interface UpcomingReservationsCardProps {
  reservations: ProUpcomingReservation[];
  isLoading: boolean;
}

export function UpcomingReservationsCard({
  reservations,
  isLoading,
}: UpcomingReservationsCardProps) {
  return (
    <Card>
      <CardHeader>
        {/* wrapper div — ne jamais mettre flex flex-row directement sur CardHeader (shadcn bug texte invisible) */}
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-derviche-dark">
            <ListChecks className="w-4 h-4 text-gold" />
            Mes réservations à venir
          </CardTitle>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-muted-foreground hover:text-derviche"
          >
            <Link href="/professional/reservations">
              Voir tout
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="divide-y">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-6 py-4 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune réservation à venir
            </p>
            <Button
              asChild
              variant="link"
              size="sm"
              className="text-derviche mt-1"
            >
              <Link href="/catalogue">Réserver maintenant →</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {reservations.map((r) => {
              const venue = [r.venue_name, r.venue_city].filter(Boolean).join(', ');
              return (
                <div key={r.reservation_id} className="px-6 py-4">
                  <p className="font-medium text-sm text-derviche-dark line-clamp-1">
                    {r.show_title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 shrink-0" />
                      {formatDate(r.slot_date)} · {formatTime(r.slot_time)}
                    </span>
                    {venue && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {venue}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
