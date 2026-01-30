/**
 * RecentReservationsCard - Carte des réservations récentes
 * Derviche Diffusion
 */

import { memo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { ListSkeleton } from './ListSkeleton';
import { formatDate, formatRelativeTime } from '../helpers';
import type { RecentReservationsCardProps } from '../types';

/**
 * Affiche la liste des réservations récentes
 */
function RecentReservationsCardComponent({
  reservations,
  isLoading,
  hasFullAccess,
}: RecentReservationsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Réservations récentes</CardTitle>
          <CardDescription>
            {hasFullAccess
              ? 'Les 10 dernières réservations'
              : 'Vos 10 dernières réservations'}
          </CardDescription>
        </div>
        <Link href="/admin/reservations">
          <Button variant="ghost" size="sm">
            Voir tout
            <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ListSkeleton count={5} />
        ) : reservations.length > 0 ? (
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {reservation.guest_first_name} {reservation.guest_last_name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">{reservation.slot.show.title}</span>
                    <span>•</span>
                    <span>{formatDate(reservation.slot.date)}</span>
                  </div>
                  {reservation.guest_structure && (
                    <p className="text-xs text-muted-foreground truncate">
                      {reservation.guest_structure}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <Badge variant="outline">
                    {reservation.num_places} place
                    {reservation.num_places > 1 ? 's' : ''}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(reservation.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune réservation récente
          </p>
        )}
      </CardContent>
    </Card>
  );
}

RecentReservationsCardComponent.displayName = 'RecentReservationsCard';

export const RecentReservationsCard = memo(RecentReservationsCardComponent);
