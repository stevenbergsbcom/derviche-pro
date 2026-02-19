/**
 * Composant ProfessionalReservations - Liste des réservations d'un professionnel
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Calendar, Ticket, MapPin, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
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

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
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
// FORMATAGE
// ============================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5); // HH:MM
}

// ============================================
// COMPOSANT
// ============================================

export function ProfessionalReservations({
  professionalId,
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

    // Normalisation de la réponse Supabase (les jointures retournent des tableaux)
    const normalized: ReservationEntry[] = (data ?? []).map((r) => {
      // Supabase retourne les relations comme un objet ou un tableau selon la config
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
        <p className="text-sm text-red-700">{error}</p>
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

  return (
    <div className="space-y-3">
      {reservations.map((reservation) => {
        const statusConfig = STATUS_CONFIG[reservation.status];

        return (
          <Link
            key={reservation.id}
            href={`/admin/reservations?reservationId=${reservation.id}`}
            className="block border rounded-lg p-3 space-y-2 bg-card hover:bg-muted/40 hover:border-derviche/30 transition-colors group"
          >
            {/* En-tête : spectacle + statut + icône lien */}
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm leading-tight group-hover:text-derviche transition-colors">
                {reservation.slot?.show_title ?? 'Spectacle inconnu'}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge
                  className={`text-xs ${statusConfig.className}`}
                  variant="outline"
                >
                  {statusConfig.label}
                </Badge>
                <ExternalLink className="h-3 w-3 text-muted-foreground/50 group-hover:text-derviche transition-colors" />
              </div>
            </div>

            {/* Détails */}
            <div className="space-y-1 text-xs text-muted-foreground">
              {reservation.slot && (
                <>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>
                      {formatDate(reservation.slot.date)} à{' '}
                      {formatTime(reservation.slot.time)}
                    </span>
                  </div>

                  {reservation.slot.venue_name && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>
                        {reservation.slot.venue_name}
                        {reservation.slot.venue_city &&
                          ` — ${reservation.slot.venue_city}`}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center gap-1.5">
                <Ticket className="h-3 w-3 shrink-0" />
                <span>
                  {reservation.num_places}{' '}
                  {reservation.num_places > 1 ? 'places' : 'place'}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
