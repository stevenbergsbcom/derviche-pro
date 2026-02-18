/**
 * Carte d'une réservation pour l'espace professionnel
 * Affichage mobile-first : toutes les infos en card, pas de tableau
 *
 * @module professional/reservations/components/ProReservationCard
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, MapPin, Users, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProCancelDialog } from './ProCancelDialog';
import type { ProReservation } from '@/lib/services/pro-reservations';

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  // timeStr format: "18:00:00" ou "18:00"
  return timeStr.slice(0, 5);
}

/** Retourne true si la réservation peut encore être annulée (date du slot > maintenant + 24h) */
function isCancellable(reservation: ProReservation): boolean {
  if (reservation.status === 'cancelled' || reservation.status === 'no_show') return false;

  const slotDateTime = new Date(`${reservation.slot.date}T${reservation.slot.time}`);
  const now = new Date();
  const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

  return slotDateTime > cutoff;
}

const STATUS_LABELS: Record<ProReservation['status'], string> = {
  confirmed: 'Confirmée',
  no_show: 'Non présenté',
  cancelled: 'Annulée',
};

const STATUS_VARIANTS: Record<
  ProReservation['status'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  confirmed: 'default',
  no_show: 'secondary',
  cancelled: 'outline',
};

// ============================================
// TYPES
// ============================================

interface ProReservationCardProps {
  reservation: ProReservation;
  onCancel: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  isCancelling: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function ProReservationCard({
  reservation,
  onCancel,
  isCancelling,
}: ProReservationCardProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const canCancel = isCancellable(reservation);

  const handleConfirmCancel = async (reason?: string) => {
    const result = await onCancel(reservation.id, reason);
    if (result.success) {
      toast.success('Réservation annulée avec succès.');
      setCancelOpen(false);
    } else {
      // On affiche le toast d'erreur puis on lève une exception
      // pour signaler l'échec au ProCancelDialog, qui conservera
      // ainsi le motif saisi par l'utilisateur sans le vider.
      toast.error(result.error ?? 'Une erreur est survenue lors de l\'annulation.');
      throw new Error(result.error ?? 'Annulation échouée');
    }
  };

  const venue =
    [reservation.slot.venue_name, reservation.slot.venue_city]
      .filter(Boolean)
      .join(' — ') || 'Lieu non renseigné';

  return (
    <>
      <Card
        className={`transition-opacity ${reservation.status === 'cancelled' ? 'opacity-60' : ''}`}
      >
        <CardContent className="p-4 space-y-3">
          {/* Titre + badge statut */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-derviche-dark leading-snug">
              {reservation.show_title}
            </h3>
            <Badge variant={STATUS_VARIANTS[reservation.status]} className="shrink-0">
              {STATUS_LABELS[reservation.status]}
            </Badge>
          </div>

          {/* Infos date / lieu / places */}
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
              <span>
                {formatDate(reservation.slot.date)} à {formatTime(reservation.slot.time)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <span>{venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-4 shrink-0" aria-hidden="true" />
              <span>
                {reservation.num_places}{' '}
                {reservation.num_places > 1 ? 'places' : 'place'}
              </span>
            </div>
          </div>

          {/* Motif annulation si applicable */}
          {reservation.status === 'cancelled' && reservation.cancellation_reason && (
            <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-3">
              Motif : {reservation.cancellation_reason}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {reservation.show_slug && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/spectacle/${reservation.show_slug}`} className="gap-1.5">
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  Voir le spectacle
                </Link>
              </Button>
            )}

            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setCancelOpen(true)}
                disabled={isCancelling}
              >
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ProCancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        showTitle={reservation.show_title}
        onConfirm={handleConfirmCancel}
        isCancelling={isCancelling}
      />
    </>
  );
}
