/**
 * Carte d'une réservation pour l'espace professionnel
 * Mobile : card empilée verticalement
 * Desktop : ligne horizontale compacte (tout visible d'un coup d'œil)
 *
 * @module professional/reservations/components/ProReservationCard
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, MapPin, Users, ExternalLink, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProCancelDialog } from './ProCancelDialog';
import { ProChangeSlotDialog } from './ProChangeSlotDialog';
import type { ProReservation } from '@/lib/services/pro-reservations';

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

/** Retourne true si la réservation peut encore être annulée (date du slot > maintenant + 24h) */
function isCancellable(reservation: ProReservation): boolean {
  if (reservation.status === 'cancelled' || reservation.status === 'no_show') return false;
  const slotDateTime = new Date(`${reservation.slot.date}T${reservation.slot.time}`);
  const now = new Date();
  const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return slotDateTime > cutoff;
}

const STATUS_LABELS: Record<ProReservation['status'], string> = {
  confirmed: 'Confirmée',
  no_show: 'Non présenté',
  cancelled: 'Annulée',
};

const STATUS_CLASSES: Record<ProReservation['status'], string> = {
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  no_show: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelled: 'bg-muted text-muted-foreground border-border',
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
  onChangeSlot: (reservationId: string, newSlotId: string) => Promise<{ success: boolean; error?: string }>;
  isChangingSlot: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function ProReservationCard({
  reservation,
  onCancel,
  isCancelling,
  onChangeSlot,
  isChangingSlot,
}: ProReservationCardProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [changeSlotOpen, setChangeSlotOpen] = useState(false);
  const canCancel = isCancellable(reservation);
  // Peut changer de créneau si la résa est confirmée et future
  const canChangeSlot = reservation.status === 'confirmed' && isCancellable(reservation);

  const handleConfirmCancel = async (reason?: string) => {
    const result = await onCancel(reservation.id, reason);
    if (result.success) {
      toast.success('Réservation annulée avec succès.');
      setCancelOpen(false);
    } else {
      toast.error(result.error ?? 'Une erreur est survenue lors de l\'annulation.');
      throw new Error(result.error ?? 'Annulation échouée');
    }
  };

  const handleConfirmChangeSlot = async (newSlotId: string) => {
    const result = await onChangeSlot(reservation.id, newSlotId);
    if (result.success) {
      toast.success('Créneau modifié avec succès. Un email de confirmation vous a été envoyé.');
      setChangeSlotOpen(false);
    } else {
      toast.error(result.error ?? 'Une erreur est survenue lors de la modification.');
      throw new Error(result.error ?? 'Modification échouée');
    }
  };

  const venue =
    [reservation.slot.venue_name, reservation.slot.venue_city]
      .filter(Boolean)
      .join(', ') || 'Lieu non renseigné';

  const isCancelled = reservation.status === 'cancelled';

  return (
    <>
      {/* ==============================
          MOBILE : card empilée (< lg)
      ============================== */}
      <div
        className={`
          lg:hidden rounded-lg border bg-card p-4 space-y-3 transition-opacity
          ${isCancelled ? 'opacity-60' : ''}
        `}
      >
        {/* Titre + badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-derviche-dark leading-snug">
            {reservation.show_title}
          </h3>
          <Badge variant={STATUS_VARIANTS[reservation.status]} className="shrink-0">
            {STATUS_LABELS[reservation.status]}
          </Badge>
        </div>

        {/* Infos */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" />
            <span>{formatDateLong(reservation.slot.date)} à {formatTime(reservation.slot.time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" />
            <span>{venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-4 shrink-0" />
            <span>{reservation.num_places} {reservation.num_places > 1 ? 'places' : 'place'}</span>
          </div>
        </div>

        {/* Motif annulation */}
        {isCancelled && reservation.cancellation_reason && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-3">
            Motif : {reservation.cancellation_reason}
          </p>
        )}

        {/* Actions mobile : empilées pleine largeur */}
        <div className="flex flex-col gap-2 pt-1">
          {canChangeSlot && (
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => setChangeSlotOpen(true)}
              disabled={isChangingSlot || isCancelling}
            >
              Modifier la réservation
            </Button>
          )}
          {reservation.show_slug && (
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/spectacle/${reservation.show_slug}`} className="gap-1.5 justify-center">
                <ExternalLink className="size-3.5" />
                Voir le spectacle
              </Link>
            </Button>
          )}
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full"
              onClick={() => setCancelOpen(true)}
              disabled={isCancelling || isChangingSlot}
            >
              Annuler la réservation
            </Button>
          )}
        </div>
      </div>

      {/* ==============================
          DESKTOP : ligne horizontale (>= lg)
      ============================== */}
      <div
        className={`
          hidden lg:flex items-center gap-4 rounded-lg border bg-card px-5 py-4
          transition-opacity hover:bg-muted/30
          ${isCancelled ? 'opacity-60' : ''}
        `}
      >
        {/* Barre colorée statut à gauche */}
        <div
          className={`
            w-1 self-stretch rounded-full shrink-0
            ${reservation.status === 'confirmed' ? 'bg-green-500' : ''}
            ${reservation.status === 'no_show' ? 'bg-yellow-400' : ''}
            ${reservation.status === 'cancelled' ? 'bg-border' : ''}
          `}
        />

        {/* Titre spectacle — col large */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-derviche-dark truncate">{reservation.show_title}</p>
          {isCancelled && reservation.cancellation_reason && (
            <p className="text-xs text-muted-foreground italic truncate mt-0.5">
              Motif : {reservation.cancellation_reason}
            </p>
          )}
        </div>

        {/* Date + heure */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground w-52 shrink-0">
          <CalendarDays className="size-4 shrink-0 text-derviche/60" />
          <span className="truncate">
            {formatDate(reservation.slot.date)}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <Clock className="size-3.5 shrink-0 text-derviche/60" />
          <span className="shrink-0">{formatTime(reservation.slot.time)}</span>
        </div>

        {/* Lieu */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground w-44 shrink-0">
          <MapPin className="size-4 shrink-0 text-derviche/60" />
          <span className="truncate">{venue}</span>
        </div>

        {/* Places */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground w-20 shrink-0">
          <Users className="size-4 shrink-0 text-derviche/60" />
          <span>{reservation.num_places} {reservation.num_places > 1 ? 'places' : 'place'}</span>
        </div>

        {/* Badge statut */}
        <div className="w-28 shrink-0 flex justify-center">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_CLASSES[reservation.status]}`}>
            {STATUS_LABELS[reservation.status]}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {reservation.show_slug && (
            <Button variant="ghost" size="sm" asChild className="text-derviche hover:text-derviche-dark">
              <Link href={`/spectacle/${reservation.show_slug}`} className="gap-1.5">
                <ExternalLink className="size-3.5" />
                Voir
              </Link>
            </Button>
          )}
          {canChangeSlot && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChangeSlotOpen(true)}
              disabled={isChangingSlot || isCancelling}
            >
              Modifier
            </Button>
          )}
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setCancelOpen(true)}
              disabled={isCancelling || isChangingSlot}
            >
              Annuler
            </Button>
          )}
          {!canCancel && !canChangeSlot && !reservation.show_slug && (
            <div className="w-16" />
          )}
        </div>
      </div>

      <ProCancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        showTitle={reservation.show_title}
        onConfirm={handleConfirmCancel}
        isCancelling={isCancelling}
      />

      <ProChangeSlotDialog
        open={changeSlotOpen}
        onOpenChange={setChangeSlotOpen}
        showTitle={reservation.show_title}
        showId={reservation.show_id}
        currentSlotId={reservation.slot.id}
        numPlaces={reservation.num_places}
        onConfirm={handleConfirmChangeSlot}
        isChanging={isChangingSlot}
      />
    </>
  );
}
