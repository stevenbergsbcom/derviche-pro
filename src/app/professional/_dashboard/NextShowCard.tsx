/**
 * NextShowCard — Dashboard Professionnel
 * Derviche Diffusion
 *
 * Card "hero" affichant le prochain spectacle réservé.
 * Si aucune réservation à venir : message d'accueil + CTA catalogue.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, MapPin, Ticket, ArrowRight, Theater } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProNextReservation } from '@/lib/services/pro-dashboard';

// ============================================
// HELPERS
// ============================================

function formatDate(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

// ============================================
// ÉTATS
// ============================================

function NextShowSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <Skeleton className="h-48 sm:h-auto sm:w-52 shrink-0" />
        <div className="p-6 space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed border-2 border-muted-foreground/30">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-derviche/10 flex items-center justify-center">
          <Theater className="w-8 h-8 text-derviche" />
        </div>
        <div className="space-y-1.5">
          <p className="font-semibold text-derviche-dark text-lg">
            Bienvenue sur Derviche Pro
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Vous n&apos;avez aucune représentation à venir. Découvrez les prochains spectacles et réservez votre place.
          </p>
        </div>
        <Button asChild className="bg-derviche hover:bg-derviche/90 text-white gap-2">
          <Link href="/catalogue">
            Découvrir les spectacles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

interface NextShowCardProps {
  reservation: ProNextReservation | null;
  isLoading: boolean;
}

export function NextShowCard({ reservation, isLoading }: NextShowCardProps) {
  if (isLoading) return <NextShowSkeleton />;
  if (!reservation) return <EmptyState />;

  const venue = [reservation.venue_name, reservation.venue_city]
    .filter(Boolean)
    .join(', ');

  return (
    <Card className="overflow-hidden border-derviche/20 shadow-sm p-0">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative h-48 sm:h-auto sm:w-52 shrink-0 bg-derviche/5">
          {reservation.show_image_url ? (
            <Image
              src={reservation.show_image_url}
              alt={reservation.show_title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full min-h-[12rem] flex items-center justify-center">
              <Theater className="w-14 h-14 text-derviche/20" />
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="p-6 flex flex-col justify-between gap-4 flex-1">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-derviche text-white text-xs">
                Prochain spectacle
              </Badge>
              {reservation.company_name && (
                <span className="text-xs text-muted-foreground">
                  {reservation.company_name}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-derviche-dark leading-tight">
              {reservation.show_title}
            </h2>

            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 shrink-0 text-gold" />
                <span>
                  {formatDate(reservation.slot_date)} à {formatTime(reservation.slot_time)}
                </span>
              </div>
              {venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0 text-gold" />
                  <span>{venue}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 shrink-0 text-gold" />
                <span>
                  {reservation.num_places} place{reservation.num_places > 1 ? 's' : ''} réservée{reservation.num_places > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {reservation.show_slug && (
            <div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-derviche text-derviche hover:bg-derviche/5 gap-2"
              >
                <Link href={`/spectacle/${reservation.show_slug}`}>
                  Voir le spectacle
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
