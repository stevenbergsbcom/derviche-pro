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
  // T12:00:00 évite les décalages de fuseau horaire sur une date YYYY-MM-DD pure
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateLong(dateStr: string): string {
  // T12:00:00 évite les décalages de fuseau horaire sur une date YYYY-MM-DD pure
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  // Format aligné avec ProChangeSlotDialog : "11h00" au lieu de "11:00"
  // timeStr attendu : HH:MM ou HH:MM:SS (format Supabase time)
  const parts = timeStr.slice(0, 5).split(':');
  const hours   = parts[0] ?? '00';
  const minutes = parts[1] ?? '00';
  return `${hours}h${minutes}`;
}

/**
 * Retourne true si la réservation peut encore être annulée (date du slot > maintenant).
 * slot.date : YYYY-MM-DD, slot.time : HH:MM ou HH:MM:SS (format Supabase)
 * On normalise à HH:MM:SS pour garantir un ISO 8601 valide.
 *
 * Politique d'annulation (décision S167) :
 * Le pro peut annuler jusqu'à l'heure exacte de début de la représentation.
 * L'ancienne règle des 24h a été supprimée volontairement — Derviche Diffusion
 * préfère libérer les places au dernier moment plutôt que les bloquer.
 */
function isCancellable(reservation: ProReservation): boolean {
  if (reservation.status === 'cancelled' || reservation.status === 'no_show') return false;
  // Normalisation : HH:MM → HH:MM:00 pour éviter une Date invalide
  const rawTime    = reservation.slot.time ?? '00:00:00';
  const normalTime = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
  const slotDateTime = new Date(`${reservation.slot.date}T${normalTime}`);
  if (isNaN(slotDateTime.getTime())) return false; // date invalide → sécurité fail-closed
  return slotDateTime > new Date();
}

/**
 * Retourne un label d'urgence si la représentation est dans moins de 24h, null sinon.
 * Ex : "Dans 45 min", "Dans 3h", "Dans 12h30"
 * Uniquement pour les réservations confirmées futures.
 */
function getUrgencyLabel(reservation: ProReservation): string | null {
  if (reservation.status !== 'confirmed') return null;
  const rawTime    = reservation.slot.time ?? '00:00:00';
  const normalTime = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
  const slotDateTime = new Date(`${reservation.slot.date}T${normalTime}`);
  if (isNaN(slotDateTime.getTime())) return null;
  const diffMs      = slotDateTime.getTime() - Date.now();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes <= 0 || diffMinutes > 24 * 60) return null;
  if (diffMinutes < 60) return `Dans ${diffMinutes} min`;
  const hours   = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return minutes === 0 ? `Dans ${hours}h` : `Dans ${hours}h${String(minutes).padStart(2, '0')}`;
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
  // Représentation passée : confirmée ou no_show mais date dépassée
  const isPast =
    reservation.status !== 'cancelled' &&
    !isCancellable(reservation);
  // Badge d'urgence : affiché si la représentation est dans moins de 24h
  const urgencyLabel = getUrgencyLabel(reservation);

  const handleConfirmCancel = async (reason?: string) => {
    const result = await onCancel(reservation.id, reason);
    if (result.success) {
      toast.success('Réservation annulée avec succès.');
      setCancelOpen(false);
    } else {
      toast.error(result.error ?? 'Une erreur est survenue lors de l\'annulation.');
      // Pas de throw : le toast suffit, le dialog reste ouvert pour permettre de réessayer
    }
  };

  const handleConfirmChangeSlot = async (newSlotId: string) => {
    const result = await onChangeSlot(reservation.id, newSlotId);
    if (result.success) {
      toast.success('Créneau modifié avec succès. Un email de confirmation vous a été envoyé.');
      setChangeSlotOpen(false);
    } else {
      toast.error(result.error ?? 'Une erreur est survenue lors de la modification.');
      // Pas de throw : le toast suffit, le dialog reste ouvert pour permettre de réessayer
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
        {/* Titre + badge statut */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-derviche-dark leading-snug">
            {reservation.show_title}
          </h3>
          <Badge variant={STATUS_VARIANTS[reservation.status]} className="shrink-0">
            {STATUS_LABELS[reservation.status]}
          </Badge>
        </div>
        {/* Badge urgence < 24h */}
        {urgencyLabel && (
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              ⏰ {urgencyLabel}
            </span>
          </div>
        )}

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
              aria-label={`Modifier la réservation pour ${reservation.show_title}`}
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
              aria-label={`Annuler la réservation pour ${reservation.show_title}`}
            >
              Annuler la réservation
            </Button>
          )}
          {isPast && !canCancel && !canChangeSlot && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              Représentation passée — modifications non disponibles
            </p>
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
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-derviche-dark truncate">{reservation.show_title}</p>
            {urgencyLabel && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 shrink-0">
                ⏰ {urgencyLabel}
              </span>
            )}
          </div>
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

        {/* Actions — largeur fixe w-56 alignée sur le header */}
        <div className="flex items-center gap-2 shrink-0 w-56 justify-end">
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
              aria-label={`Modifier la réservation pour ${reservation.show_title}`}
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
              aria-label={`Annuler la réservation pour ${reservation.show_title}`}
            >
              Annuler
            </Button>
          )}
          {!canCancel && !canChangeSlot && isPast && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Représentation passée
            </span>
          )}
          {!canCancel && !canChangeSlot && !isPast && !reservation.show_slug && (
            <div className="w-16" aria-hidden="true" />
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
