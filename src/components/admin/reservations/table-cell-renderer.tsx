/**
 * Rendu des cellules du tableau des réservations
 * Derviche Diffusion
 */

'use client';

import React from 'react';
import type { ReservationColumn } from '@/hooks/useUserPreferences';
import type { AdminReservation } from '@/lib/services/admin-reservations';
import { ReservationStatusBadge, ReservationCheckinBadge } from './reservation-badges';
import { formatDateFr, formatDateTimeFr, formatBookedByLabel } from './reservation-helpers';

/**
 * Rendu d'une cellule du tableau selon la colonne.
 *
 * @param visibleColumns Liste des colonnes visibles — permet au rendu de
 *   placer la ligne italique « qui a saisi » sous la première colonne Nom/Prénom
 *   visible (audit F.3 : si l'admin masque `lastName` mais affiche `firstName`,
 *   la traçabilité doit basculer sous `firstName`).
 */
export function renderTableCell(
  col: ReservationColumn,
  r: AdminReservation,
  visibleColumns?: ReservationColumn[],
): React.ReactNode {
  // La ligne italique « qui a saisi » apparaît sous la PREMIÈRE colonne
  // de nom/prénom visible, pour ne pas disparaître si l'admin a masqué
  // `lastName` (audit F.3). Par défaut elle reste sous `lastName`.
  const showBookedByUnder: ReservationColumn | null = (() => {
    if (!visibleColumns || visibleColumns.length === 0) return 'lastName';
    if (visibleColumns.includes('lastName')) return 'lastName';
    if (visibleColumns.includes('firstName')) return 'firstName';
    return null;
  })();

  switch (col) {
    case 'date':
      return r.slot ? (
        <div>
          <div className="font-medium">{formatDateFr(r.slot.date)}</div>
          <div className="text-sm text-muted-foreground">{r.slot.time}</div>
        </div>
      ) : '-';
    case 'spectacle':
      return r.slot ? (
        <div className="max-w-[280px]">
          <div className="font-semibold text-derviche truncate" title={r.slot.show?.title}>
            {r.slot.show?.title || 'Spectacle inconnu'}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>{formatDateFr(r.slot.date)} à {r.slot.time}</span>
            {r.slot.venue && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="truncate">{r.slot.venue.name}</span>
              </>
            )}
          </div>
        </div>
      ) : '-';
    case 'venue':
      return <span className="text-sm">{r.slot?.venue?.name || '-'}</span>;
    case 'lastName':
      return (
        <div className="flex flex-col">
          <span className="font-medium">{r.lastName}</span>
          {showBookedByUnder === 'lastName' && (
            <span className="text-[11px] text-muted-foreground italic">
              {formatBookedByLabel(r.bookedBy)}
            </span>
          )}
        </div>
      );
    case 'firstName':
      return showBookedByUnder === 'firstName' ? (
        <div className="flex flex-col">
          <span>{r.firstName}</span>
          <span className="text-[11px] text-muted-foreground italic">
            {formatBookedByLabel(r.bookedBy)}
          </span>
        </div>
      ) : (
        r.firstName
      );
    case 'email':
      return <span className="text-sm">{r.email}</span>;
    case 'phone':
      return <span className="text-sm">{r.phone || '-'}</span>;
    case 'emailSecondary':
      return <span className="text-sm">{r.emailSecondary || '-'}</span>;
    case 'phoneSecondary':
      return <span className="text-sm">{r.phoneSecondary || '-'}</span>;
    case 'organization':
      return <span className="text-sm">{r.organization || '-'}</span>;
    case 'function':
      return <span className="text-sm">{r.function || '-'}</span>;
    case 'afcNumber':
      return <span className="text-sm">{r.afcNumber || '-'}</span>;
    case 'address': {
      const postalCity = [r.postalCode, r.city].filter(Boolean).join(' ');
      const fullAddress = [r.address, postalCity].filter(Boolean).join(', ').trim();
      return (
        <span className="text-sm max-w-[200px] truncate block" title={fullAddress}>
          {fullAddress || '-'}
        </span>
      );
    }
    // S175 — adresse séparée en colonnes individuelles
    case 'addressStreet':
      return (
        <span className="text-sm max-w-[180px] truncate block" title={r.address || ''}>
          {r.address || '-'}
        </span>
      );
    case 'addressPostalCode':
      return <span className="text-sm">{r.postalCode || '-'}</span>;
    case 'addressCity':
      return <span className="text-sm">{r.city || '-'}</span>;
    case 'addressCountry':
      return <span className="text-sm">{r.country || '-'}</span>;
    case 'numPlaces':
      return <span className="text-center block">{r.numPlaces}</span>;
    case 'status':
      return <ReservationStatusBadge status={r.status} />;
    case 'checkinStatus':
      return <ReservationCheckinBadge status={r.checkinStatus} />;
    case 'specialRequests':
      return (
        <span className="text-sm max-w-[150px] truncate block" title={r.specialRequests || ''}>
          {r.specialRequests || '-'}
        </span>
      );
    case 'checkinNotes':
      return (
        <span className="text-sm max-w-[150px] truncate block" title={r.checkinComment || ''}>
          {r.checkinComment || '-'}
        </span>
      );
    case 'checkinVenueNotes':
      return (
        <span className="text-sm max-w-[150px] truncate block" title={r.checkinVenueNotes || ''}>
          {r.checkinVenueNotes || '-'}
        </span>
      );
    case 'checkinInternalNotes':
      return (
        <span className="text-sm max-w-[150px] truncate block" title={r.checkinInternalNotes || ''}>
          {r.checkinInternalNotes || '-'}
        </span>
      );
    case 'createdAt':
      return <span className="text-sm text-muted-foreground">{formatDateTimeFr(r.createdAt)}</span>;
    // S175 — Identifiants externes / techniques
    case 'crmIdPro':
      return (
        <span className="text-sm font-mono" title={r.crmId || ''}>
          {r.crmId || '-'}
        </span>
      );
    case 'crmIdVenue':
      return (
        <span className="text-sm font-mono" title={r.slot?.venue?.crmId || ''}>
          {r.slot?.venue?.crmId || '-'}
        </span>
      );
    case 'userUuid':
      return (
        <span className="text-xs font-mono text-muted-foreground" title={r.userId || ''}>
          {r.userId || '-'}
        </span>
      );
    case 'venueUuid':
      return (
        <span className="text-xs font-mono text-muted-foreground" title={r.slot?.venue?.id || ''}>
          {r.slot?.venue?.id || '-'}
        </span>
      );
    default:
      return '-';
  }
}
