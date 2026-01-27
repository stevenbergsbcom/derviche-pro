'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '../helpers';
import { HostedByBadge } from './HostedByBadge';
import { CapacityDisplayMobile } from './CapacityDisplay';
import type { RepresentationCardProps } from '../types';

/**
 * Carte d'une représentation (mobile)
 */
export function RepresentationCard({
  representation: rep,
  internalUsers,
  isExterne,
  onEdit,
  onDelete,
  isSubmitting,
}: RepresentationCardProps) {
  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        {/* Date et heure */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="font-medium">{formatDate(rep.date)}</span>
              <span className="text-muted-foreground">•</span>
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span>{rep.time}</span>
            </div>
          </div>
        </div>

        {/* Lieu et badge accueil */}
        <div className="flex items-center gap-2 flex-wrap">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="flex-1 min-w-0">{rep.venueName}</span>
          <div className="shrink-0">
            <HostedByBadge
              hostedBy={rep.hostedBy}
              hostedById={rep.hostedById}
              internalUsers={internalUsers}
            />
          </div>
        </div>

        {/* Capacité */}
        <CapacityDisplayMobile booked={rep.booked} capacity={rep.capacity} />

        {/* Actions (masquées pour les externes) */}
        {!isExterne && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => void onEdit(rep)}
              disabled={isSubmitting}
              aria-label={`Modifier la représentation du ${formatDate(rep.date)}`}
            >
              <Pencil className="w-4 h-4 mr-2" aria-hidden="true" />
              Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => void onDelete(rep)}
              disabled={isSubmitting}
              aria-label={`Supprimer la représentation du ${formatDate(rep.date)}`}
            >
              <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Supprimer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
