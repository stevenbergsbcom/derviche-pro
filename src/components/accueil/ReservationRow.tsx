/**
 * ReservationRow - Ligne de réservation
 * Derviche Diffusion
 * 
 * Affiche une réservation dans une liste avec statut
 * Interface mobile-first pour l'accueil sur place
 */

'use client';

import { cn } from '@/lib/utils';
import { getFullName } from '@/lib/utils/guest';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Users, Mail, Building2 } from 'lucide-react';
import { StatusBadge, isPresent } from './StatusBadge';
import type { CheckinStatus } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface ReservationRowData {
  id: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestStructure: string | null;
  guestEmail: string | null;
  numPlaces: number;
  checkinStatus: CheckinStatus | null;
  status: 'confirmed' | 'cancelled' | 'no_show';
  // Champs optionnels pour le drawer de check-in
  /** Commentaire de check-in */
  checkinComment?: string | null;
  /** Notes sur le lieu (visibles par tous) */
  checkinVenueNotes?: string | null;
  /** Notes internes Derviche (visibles uniquement par admin) */
  checkinInternalNotes?: string | null;
  /** Téléphone du guest */
  guestPhone?: string | null;
  /** Email secondaire */
  guestEmailSecondary?: string | null;
  /** Téléphone secondaire */
  guestPhoneSecondary?: string | null;
  /** Fonction du guest */
  guestFunction?: string | null;
  /** Adresse */
  guestAddress?: string | null;
  /** Code postal */
  guestPostalCode?: string | null;
  /** Ville */
  guestCity?: string | null;
  /** Numéro AFC */
  guestAfcNumber?: string | null;
  /** Demandes spéciales */
  specialRequests?: string | null;
  /** ID de l'événement Google Calendar (null si jamais créé) */
  googleCalendarEventId?: string | null;
}

export interface ReservationRowProps {
  /** Données de la réservation */
  reservation: ReservationRowData;
  /** Handler au clic */
  onClick: () => void;
  /** Classes CSS additionnelles */
  className?: string;
}

// ============================================
// COMPOSANT
// ============================================

export function ReservationRow({ reservation, onClick, className }: ReservationRowProps) {
  const fullName = getFullName(reservation.guestFirstName, reservation.guestLastName);
  const isCancelled = reservation.status === 'cancelled';
  const checkedIn = isPresent(reservation.checkinStatus);

  return (
    <button
      type="button"
      onClick={onClick}

      className={cn(
        'w-full flex items-center gap-3 p-3 text-left',
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        'transition-all',
        'hover:shadow-md hover:border-gray-300 active:scale-[0.99]',
        checkedIn && 'bg-green-50/50 border-green-200',
        isCancelled && 'opacity-60 bg-gray-50 border-dashed',
        className
      )}
    >
      {/* Pastille de statut - plus grande */}
      <StatusBadge
        status={isCancelled ? null : reservation.checkinStatus}
        size="md"
        className={cn(isCancelled && 'opacity-50')}
      />

      {/* Infos principales */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-semibold text-lg truncate',
            checkedIn && 'text-green-700',
            isCancelled && 'line-through text-muted-foreground'
          )}
        >
          {fullName}
        </p>
        
        {/* Structure et/ou email */}
        <div className="mt-1 space-y-0.5">
          {reservation.guestStructure && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{reservation.guestStructure}</span>
            </p>
          )}
          {reservation.guestEmail && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{reservation.guestEmail}</span>
            </p>
          )}
        </div>
      </div>

      {/* Nombre de places */}
      {reservation.numPlaces > 1 && (
        <Badge variant="secondary" className="shrink-0 text-sm font-medium">
          <Users className="w-3.5 h-3.5 mr-1" />
          {reservation.numPlaces}
        </Badge>
      )}

      {/* Badge annulé */}
      {isCancelled && (
        <Badge variant="outline" className="shrink-0 text-sm text-red-600 border-red-200">
          Annulé
        </Badge>
      )}

      {/* Chevron */}
      <ChevronRight className={cn(
        'w-5 h-5 shrink-0',
        isCancelled ? 'text-muted-foreground/50' : 'text-muted-foreground'
      )} />
    </button>
  );
}

// ============================================
// SKELETON
// ============================================

export function ReservationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

// ============================================
// GROUPE VIDE
// ============================================

export function EmptyReservations({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
        <Users className="w-6 h-6 text-muted-foreground/50" />
      </div>
      <p className="text-base text-muted-foreground">
        {message || 'Aucune réservation'}
      </p>
    </div>
  );
}
