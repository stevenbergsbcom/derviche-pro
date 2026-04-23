/**
 * Carte de réservation pour l'affichage mobile
 * Derviche Diffusion
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Ticket,
  Pencil,
} from 'lucide-react';
import type { ReservationColumn } from '@/hooks/useUserPreferences';
import type { AdminReservation } from '@/lib/services/admin-reservations';
import { ReservationStatusBadge, ReservationCheckinBadge } from './reservation-badges';
import { formatDateFr, formatDateTimeFr, formatBookedByLabel } from './reservation-helpers';

// ============================================
// COMPOSANT RESERVATION CARD (MOBILE)
// ============================================

interface ReservationCardProps {
  reservation: AdminReservation;
  visibleColumns: ReservationColumn[];
  onEdit: (reservation: AdminReservation) => void;
}

export function ReservationCard({ reservation, visibleColumns, onEdit }: ReservationCardProps) {
  const isCancelled = reservation.status === 'cancelled';
  const isColumnVisible = (col: ReservationColumn) => visibleColumns.includes(col);
  const showName = isColumnVisible('lastName') || isColumnVisible('firstName');

  return (
    <Card 
      className={`py-1 cursor-pointer hover:bg-muted/50 transition-colors ${isCancelled ? 'opacity-60' : ''}`}
      onClick={() => onEdit(reservation)}
    >
      <CardContent className="px-3 py-1.5">
        {/* Header: Nom + Actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            {showName && (
              <h3 className="font-semibold text-base truncate">
                {isColumnVisible('firstName') && reservation.firstName}
                {isColumnVisible('firstName') && isColumnVisible('lastName') && ' '}
                {isColumnVisible('lastName') && reservation.lastName}
              </h3>
            )}
            {showName && (
              <p className="text-[11px] text-muted-foreground italic truncate">
                {formatBookedByLabel(reservation.bookedBy)}
              </p>
            )}
            {isColumnVisible('email') && (
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                <Mail className="w-3 h-3 shrink-0" />
                {reservation.email}
              </p>
            )}
            {isColumnVisible('phone') && reservation.phone && (
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                <Phone className="w-3 h-3 shrink-0" />
                {reservation.phone}
              </p>
            )}
            {isColumnVisible('organization') && reservation.organization && (
              <p className="text-xs text-muted-foreground mt-1">{reservation.organization}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 -mt-1 -mr-2"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(reservation)}>
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Spectacle + Date */}
        {reservation.slot && (isColumnVisible('spectacle') || isColumnVisible('date')) && (
          <div className="bg-muted/50 rounded-lg p-3 mb-3 space-y-1">
            {isColumnVisible('spectacle') && (
              <p className="font-medium text-sm line-clamp-1">
                {reservation.slot.show?.title || 'Spectacle inconnu'}
              </p>
            )}
            {isColumnVisible('date') && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateFr(reservation.slot.date)} à {reservation.slot.time}
                </span>
              </div>
            )}
            {isColumnVisible('venue') && reservation.slot.venue && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {reservation.slot.venue.name}
              </p>
            )}
          </div>
        )}

        {/* Infos supplémentaires si visibles */}
        {(isColumnVisible('specialRequests') && reservation.specialRequests) && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            <strong>Demandes :</strong> {reservation.specialRequests}
          </p>
        )}

        {/* Footer: Places + Statuts */}
        <div className="flex flex-wrap items-center gap-2">
          {isColumnVisible('numPlaces') && (
            <span className="inline-flex items-center gap-1 text-sm font-medium">
              <Ticket className="w-3.5 h-3.5 text-derviche" />
              {reservation.numPlaces} place{reservation.numPlaces > 1 ? 's' : ''}
            </span>
          )}
          {isColumnVisible('status') && <ReservationStatusBadge status={reservation.status} />}
          {isColumnVisible('checkinStatus') && <ReservationCheckinBadge status={reservation.checkinStatus} />}
        </div>

        {/* Date de création si visible */}
        {isColumnVisible('createdAt') && (
          <p className="text-xs text-muted-foreground mt-2">
            Créé le {formatDateTimeFr(reservation.createdAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
