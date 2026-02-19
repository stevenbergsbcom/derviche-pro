/**
 * Composant ProfessionalReservations - Liste des réservations d'un professionnel
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Ticket,
  MapPin,
  Loader2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { ProfessionalReservationsProps } from '@/app/admin/professionnels/types';
import type { ReservationStatus } from '@/types/database';

// ============================================
// TYPES LOCAUX
// ============================================

interface ReservationEntry {
  id: string;
  num_places: number;
  status: ReservationStatus;
  created_at: string;
  slot: {
    date: string;
    time: string;
    show_title: string;
    venue_name: string;
    venue_city: string;
  } | null;
}

// ============================================
// CONFIGURATION STATUTS
// ============================================

const STATUS_CONFIG: Record<ReservationStatus, { label: string; className: string }> = {
  confirmed: {
    label: 'Confirmée',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  cancelled: {
    label: 'Annulée',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  no_show: {
    label: 'Absent',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};

// ============================================
// HELPERS
// ============================================

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) >= new Date(new Date().toDateString());
}

// ============================================
// SOUS-COMPOSANT : CARD RÉSERVATION
// ============================================

function ReservationCard({
  reservation,
  isPast,
}: {
  reservation: ReservationEntry;
  isPast: boolean;
}) {
  const statusConfig = STATUS_CONFIG[reservation.status];

  return (
    <Link
      href={`/admin/reservations?reservationId=${reservation.id}`}
      className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 transition-colors group ${
        isPast
          ? 'bg-muted/30 border-muted hover:bg-muted/50 opacity-70'
          : 'bg-card border-border hover:bg-muted/40 hover:border-derviche/30'
      }`}
    >
      {/* Colonne gauche : date en bloc */}
      <div
        className={`flex flex-col items-center justify-center w-10 shrink-0 rounded-md py-1 ${
          isPast ? 'bg-muted' : 'bg-derviche/8'
        }`}
      >
        {reservation.slot ? (
          <>
            <span className={`text-xs font-bold leading-none ${isPast ? 'text-muted-foreground' : 'text-derviche'}`}>
              {new Date(reservation.slot.date).toLocaleDateString('fr-FR', { day: '2-digit' })}
            </span>
            <span className={`text-[10px] leading-none mt-0.5 ${isPast ? 'text-muted-foreground' : 'text-derviche/70'}`}>
              {new Date(reservation.slot.date).toLocaleDateString('fr-FR', { month: 'short' })}
            </span>
          </>
        ) : (
          <Calendar className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Colonne centrale : infos */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate leading-tight group-hover:text-derviche transition-colors ${isPast ? 'text-muted-foreground' : ''}`}>
          {reservation.slot?.show_title ?? 'Spectacle inconnu'}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          {reservation.slot?.venue_name && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              {reservation.slot.venue_name}
              {reservation.slot.venue_city && ` — ${reservation.slot.venue_city}`}
            </span>
          )}
          <span className="flex items-center gap-1 shrink-0">
            <Ticket className="h-2.5 w-2.5 shrink-0" />
            {reservation.num_places} pl.
          </span>
        </div>
      </div>

      {/* Colonne droite : statut + lien */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <Badge className={`text-[10px] px-1.5 py-0 h-4 ${statusConfig.className}`} variant="outline">
          {statusConfig.label}
        </Badge>
        <ExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-derviche transition-colors" />
      </div>
    </Link>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function ProfessionalReservations({
  professionalId,
  professionalName,
}: ProfessionalReservationsProps) {
  const [reservations, setReservations] = useState<ReservationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { data, error: fetchError } = await supabase
      .from('reservations')
      .select(
        `
        id,
        num_places,
        status,
        created_at,
        slots:slot_id (
          date,
          time,
          shows:show_id ( title ),
          venues:venue_id ( name, city )
        )
      `
      )
      .eq('user_id', professionalId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      logger.error('ProfessionalReservations: fetch error', { error: fetchError.message });
      setError('Impossible de charger les réservations');
      setIsLoading(false);
      return;
    }

    const normalized: ReservationEntry[] = (data ?? []).map((r) => {
      const slot = Array.isArray(r.slots) ? r.slots[0] : r.slots;
      const show = slot ? (Array.isArray(slot.shows) ? slot.shows[0] : slot.shows) : null;
      const venue = slot ? (Array.isArray(slot.venues) ? slot.venues[0] : slot.venues) : null;

      return {
        id: r.id,
        num_places: r.num_places,
        status: r.status as ReservationStatus,
        created_at: r.created_at,
        slot: slot
          ? {
              date: slot.date,
              time: slot.time,
              show_title: show?.title ?? 'Spectacle inconnu',
              venue_name: venue?.name ?? '',
              venue_city: venue?.city ?? '',
            }
          : null,
      };
    });

    setReservations(normalized);
    setIsLoading(false);
  }, [professionalId]);

  useEffect(() => {
    void fetchReservations();
  }, [fetchReservations]);

  // ---- États ----

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Chargement des réservations…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm text-red-700">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void fetchReservations()}
            className="h-7 px-2 text-red-700 hover:text-red-800 hover:bg-red-100"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        Aucune réservation enregistrée
      </p>
    );
  }

  // ---- Tri : futures d'abord, passées ensuite ----
  const upcoming = reservations.filter((r) => r.slot && isUpcoming(r.slot.date));
  const past = reservations.filter((r) => !r.slot || !isUpcoming(r.slot.date));

  // Tri interne : futures par date ASC, passées par date DESC
  upcoming.sort((a, b) =>
    (a.slot?.date ?? '').localeCompare(b.slot?.date ?? '')
  );
  past.sort((a, b) =>
    (b.slot?.date ?? '').localeCompare(a.slot?.date ?? '')
  );

  // Résumé
  const totalPlaces = reservations
    .filter((r) => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.num_places, 0);

  return (
    <div
      className="space-y-4"
      aria-label={`Réservations de ${professionalName}`}
    >
      {/* Résumé */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground border-b pb-3">
        <span>
          <strong className="text-foreground">{reservations.length}</strong>{' '}
          {reservations.length > 1 ? 'réservations' : 'réservation'}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span>
          <strong className="text-foreground">{totalPlaces}</strong>{' '}
          {totalPlaces > 1 ? 'places confirmées' : 'place confirmée'}
        </span>
      </div>

      {/* Réservations à venir */}
      {upcoming.length > 0 && (
        <div className="space-y-1.5">
          {past.length > 0 && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              À venir
            </p>
          )}
          {upcoming.map((r) => (
            <ReservationCard key={r.id} reservation={r} isPast={false} />
          ))}
        </div>
      )}

      {/* Réservations passées */}
      {past.length > 0 && (
        <div className="space-y-1.5">
          {upcoming.length > 0 && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Passées
            </p>
          )}
          {past.map((r) => (
            <ReservationCard key={r.id} reservation={r} isPast={true} />
          ))}
        </div>
      )}
    </div>
  );
}
