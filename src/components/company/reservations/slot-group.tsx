/**
 * SlotGroup — un groupe de réservations d'une représentation
 * Derviche Diffusion — S198
 *
 * Affiche un header horizontal (spectacle · date + heure · lieu) suivi
 * d'une mini-table (desktop) ou de mini-cards (mobile) regroupant toutes
 * les réservations de ce créneau.
 *
 * Pas de compteurs dans le header (décision produit).
 */

'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Drama, Calendar, MapPin, User } from 'lucide-react';
import {
  type SortOption,
  COLUMN_HEADERS,
  SortableHeader,
  renderTableCell,
  formatDateFr,
} from '@/components/company/reservations';
import type { CompanyReservationColumn } from '@/hooks/useUserPreferences';
import type {
  CompanyReservation,
  CompanyReservationSlot,
} from '@/lib/services/company-reservations';

// ============================================
// CONFIG BADGES (copie des configs de reservations-content)
// ============================================

const STATUS_BADGE_CONFIG = {
  confirmed: { label: 'Confirmée', variant: 'default' as const },
  cancelled: { label: 'Annulée', variant: 'destructive' as const },
  no_show: { label: 'No-show', variant: 'secondary' as const },
} as const;

const CHECKIN_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  present_loved: { label: 'A aimé', className: 'bg-green-100 text-green-800' },
  present_press: { label: 'Presse', className: 'bg-blue-100 text-blue-800' },
  present_neutral: { label: 'Neutre', className: 'bg-gray-100 text-gray-800' },
  absent: { label: 'Absent', className: 'bg-red-100 text-red-800' },
} as const;

// ============================================
// PROPS
// ============================================

interface SlotGroupProps {
  /** Slot de la représentation (null si réservation orpheline). */
  slot: CompanyReservationSlot | null;
  /** Réservations de ce slot. */
  reservations: CompanyReservation[];
  /** Colonnes visibles dans la mini-table. */
  columns: CompanyReservationColumn[];
  /** Tri courant. */
  currentSort: SortOption | undefined;
  /** Callback changement de tri. */
  onSortChange: (sortBy: SortOption | undefined) => void;
}

// ============================================
// HEADER HORIZONTAL
// ============================================

function GroupHeader({ slot }: { slot: CompanyReservationSlot | null }) {
  // Cas slot null — rare (réservation orpheline)
  if (!slot) {
    return (
      <div className="flex items-center px-4 py-3 bg-muted/40 border-b">
        <span className="text-sm italic text-muted-foreground">
          Représentation inconnue
        </span>
      </div>
    );
  }

  const showTitle = slot.show?.title ?? 'Spectacle inconnu';
  const venueName = slot.venue?.name ?? 'Lieu inconnu';
  const venueCity = slot.venue?.city ?? '';
  const timeShort = slot.time.slice(0, 5);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 bg-muted/40 border-b">
      <h3 className="flex items-center gap-1.5 font-semibold text-base text-derviche-dark">
        <Drama aria-hidden="true" className="w-4 h-4 shrink-0" />
        <span>{showTitle}</span>
      </h3>
      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        <Calendar aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
        {formatDateFr(slot.date)} · {timeShort}
      </span>
      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
        {venueName}
        {venueCity && `, ${venueCity}`}
      </span>
    </div>
  );
}

// ============================================
// MINI-CARDS MOBILE (sans duplication slot)
// ============================================

function ReservationMiniCard({ reservation }: { reservation: CompanyReservation }) {
  const status = STATUS_BADGE_CONFIG[reservation.status] || {
    label: reservation.status,
    variant: 'secondary' as const,
  };
  const checkin = reservation.checkinStatus
    ? CHECKIN_BADGE_CONFIG[reservation.checkinStatus]
    : null;

  return (
    <div
      className={`px-4 py-3 border-b last:border-b-0 ${
        reservation.status === 'cancelled' ? 'opacity-60' : ''
      }`}
    >
      {/* Ligne 1 : nom + badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="font-medium text-sm">
            {reservation.firstName} {reservation.lastName}
          </span>
        </div>
        <div className="flex gap-1 shrink-0">
          <Badge variant={status.variant} className="text-xs">
            {status.label}
          </Badge>
          {checkin && (
            <Badge className={`text-xs ${checkin.className}`}>{checkin.label}</Badge>
          )}
        </div>
      </div>

      {/* Ligne 2 : contact + places */}
      <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
        {reservation.organization && <p>{reservation.organization}</p>}
        <p>{reservation.email}</p>
        <p>
          {reservation.numPlaces} place{reservation.numPlaces > 1 ? 's' : ''}
        </p>
      </div>

      {/* Ligne 3 : demandes / notes si présentes */}
      {(reservation.specialRequests ||
        reservation.checkinNotes ||
        reservation.checkinVenueNotes ||
        reservation.cancellationReason) && (
        <div className="text-xs text-muted-foreground space-y-0.5 mt-2 pt-2 border-t border-border">
          {reservation.specialRequests && (
            <p>
              <span className="font-medium text-foreground">Demandes :</span>{' '}
              {reservation.specialRequests}
            </p>
          )}
          {reservation.checkinNotes && (
            <p>
              <span className="font-medium text-foreground">Note check-in :</span>{' '}
              {reservation.checkinNotes}
            </p>
          )}
          {reservation.checkinVenueNotes && (
            <p>
              <span className="font-medium text-foreground">Note lieu :</span>{' '}
              {reservation.checkinVenueNotes}
            </p>
          )}
          {reservation.cancellationReason && (
            <p>
              <span className="font-medium text-foreground">Motif annulation :</span>{' '}
              {reservation.cancellationReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

function SlotGroupComponent({
  slot,
  reservations,
  columns,
  currentSort,
  onSortChange,
}: SlotGroupProps) {
  return (
    <Card className="py-0 overflow-hidden">
      <CardContent className="p-0">
        <GroupHeader slot={slot} />

        {/* Vue mobile (< lg) : mini-cards sans duplication slot */}
        <div className="lg:hidden">
          {reservations.map((r) => (
            <ReservationMiniCard key={r.id} reservation={r} />
          ))}
        </div>

        {/* Vue desktop (lg+) : mini-table avec colonnes configurables */}
        <div className="hidden lg:block overflow-x-auto">
          <table
            className="w-full caption-bottom text-sm"
            aria-label="Réservations de la représentation"
          >
            <thead className="[&_tr]:border-b bg-muted/30 border-b">
              <tr className="border-b transition-colors">
                {columns.map((col) => (
                  <SortableHeader
                    key={col}
                    column={col}
                    label={COLUMN_HEADERS[col]}
                    currentSort={currentSort}
                    onSort={onSortChange}
                    className={col === 'numPlaces' ? 'text-center' : ''}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {reservations.map((r, index) => (
                <tr
                  key={r.id}
                  className={`border-b transition-colors hover:bg-muted/70 ${
                    r.status === 'cancelled' ? 'opacity-60' : ''
                  } ${index % 2 === 1 ? 'bg-muted/50' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col} className="p-2 align-middle whitespace-nowrap">
                      {renderTableCell(col, r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

SlotGroupComponent.displayName = 'SlotGroup';

export const SlotGroup = memo(SlotGroupComponent);
