'use client';

import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { MapPin, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '../helpers';
import { HostedByBadge } from './HostedByBadge';
import { CapacityDisplay } from './CapacityDisplay';
import type { RepresentationTableRowProps } from '../types';

/**
 * Ligne du tableau des représentations (desktop)
 */
export function RepresentationTableRow({
  representation: rep,
  internalUsers,
  isExterne,
  onEdit,
  onDelete,
  isSubmitting,
  isPast,
}: RepresentationTableRowProps) {
  return (
    <TableRow className={cn(isPast && 'opacity-50')}>
      {/* Date */}
      <TableCell className={cn('font-medium', isPast && 'line-through text-muted-foreground')}>
        {formatDate(rep.date)}
      </TableCell>
      
      {/* Heure */}
      <TableCell>{rep.time}</TableCell>
      
      {/* Lieu */}
      <TableCell>
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          {rep.venueName}
        </div>
      </TableCell>
      
      {/* Capacité */}
      <TableCell>
        <CapacityDisplay booked={rep.booked} capacity={rep.capacity} />
      </TableCell>
      
      {/* Accueil */}
      <TableCell>
        <HostedByBadge
          hostedBy={rep.hostedBy}
          hostedById={rep.hostedById}
          internalUsers={internalUsers}
        />
      </TableCell>
      
      {/* Actions (masquées pour les externes) */}
      {!isExterne && (
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => void onEdit(rep)}
              disabled={isSubmitting}
              aria-label={`Modifier la représentation du ${formatDate(rep.date)}`}
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Modifier</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => void onDelete(rep)}
              disabled={isSubmitting}
              aria-label={`Supprimer la représentation du ${formatDate(rep.date)}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Supprimer</span>
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
