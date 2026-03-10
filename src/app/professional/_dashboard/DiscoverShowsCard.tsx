/**
 * DiscoverShowsCard — Dashboard Professionnel
 * Derviche Diffusion
 *
 * Affiche jusqu'à 3 spectacles publiés non encore réservés par le pro.
 * CTA "Voir le catalogue" si des spectacles existent.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, MapPin, ArrowRight, Sparkles, Theater } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProDiscoverShow } from '@/lib/services/pro-dashboard';
import { formatDateShort, formatTime } from './utils';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

interface DiscoverShowsCardProps {
  shows: ProDiscoverShow[];
  isLoading: boolean;
}

export function DiscoverShowsCard({ shows, isLoading }: DiscoverShowsCardProps) {
  return (
    <Card>
      <CardHeader>
        {/* wrapper div — ne jamais mettre flex flex-row directement sur CardHeader (shadcn bug texte invisible) */}
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-derviche-dark">
            <Sparkles className="w-4 h-4 text-gold" />
            À découvrir
          </CardTitle>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-muted-foreground hover:text-derviche"
          >
            <Link href="/catalogue">
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
              <div key={i} className="flex items-center gap-3 px-6 py-4">
                <Skeleton className="w-12 h-12 rounded shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : shows.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Vous avez déjà réservé tous les spectacles disponibles 🎉
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {shows.map((show) => {
              const hasNextSlot = !!show.next_slot_date;
              const venue = [show.next_venue_name, show.next_venue_city]
                .filter(Boolean)
                .join(', ');

              return (
                <Link
                  key={show.id}
                  href={`/spectacle/${show.slug}`}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-muted/50 transition-colors group"
                >
                  {/* Miniature */}
                  <div className="relative w-12 h-12 rounded overflow-hidden shrink-0 bg-derviche/5">
                    {show.image_url ? (
                      <Image
                        src={show.image_url}
                        alt={show.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Theater className="w-5 h-5 text-derviche/30" />
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-derviche-dark line-clamp-1 group-hover:text-derviche transition-colors">
                      {show.title}
                    </p>
                    {show.company_name && (
                      <p className="text-xs text-muted-foreground">{show.company_name}</p>
                    )}
                    {hasNextSlot && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <CalendarDays className="w-3 h-3 shrink-0" />
                        <span>
                          {formatDateShort(show.next_slot_date!)} · {formatTime(show.next_slot_time!)}
                        </span>
                        {venue && (
                          <>
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{venue}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-derviche transition-colors shrink-0 mt-0.5" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
