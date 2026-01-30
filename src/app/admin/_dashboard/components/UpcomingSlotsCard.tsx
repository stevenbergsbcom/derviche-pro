/**
 * UpcomingSlotsCard - Carte des prochaines représentations
 * Derviche Diffusion
 */

import { memo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, Clock, MapPin } from 'lucide-react';
import { ListSkeleton } from './ListSkeleton';
import { formatDate, formatTime, getOccupancyBadgeVariant, formatCapacity } from '../helpers';
import type { UpcomingSlotsCardProps } from '../types';

/**
 * Affiche la liste des prochaines représentations avec taux de remplissage
 */
function UpcomingSlotsCardComponent({
  slots,
  isLoading,
  hasFullAccess,
}: UpcomingSlotsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Prochaines représentations</CardTitle>
          <CardDescription>
            {hasFullAccess ? 'Les 10 prochains créneaux' : 'Vos 10 prochains créneaux'}
          </CardDescription>
        </div>
        <Link href="/admin/spectacles">
          <Button variant="ghost" size="sm">
            Voir tout
            <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ListSkeleton count={5} />
        ) : slots.length > 0 ? (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{slot.show.title}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar aria-hidden="true" className="h-3 w-3" />
                      {formatDate(slot.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock aria-hidden="true" className="h-3 w-3" />
                      {formatTime(slot.time)}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin aria-hidden="true" className="h-3 w-3" />
                      {slot.venue.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Badge variant={getOccupancyBadgeVariant(slot.occupancy_rate)}>
                    {slot.reservations_count}/{formatCapacity(slot.capacity)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun créneau à venir
          </p>
        )}
      </CardContent>
    </Card>
  );
}

UpcomingSlotsCardComponent.displayName = 'UpcomingSlotsCard';

export const UpcomingSlotsCard = memo(UpcomingSlotsCardComponent);
