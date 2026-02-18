/**
 * Bannière de rapatriement des réservations guest
 * Affichée au chargement du dashboard si des réservations orphelines sont détectées.
 * L'utilisateur choisit quelles réservations il souhaite récupérer.
 *
 * Comportement :
 * - Dismissible : l'utilisateur peut fermer sans agir
 * - Tout coché par défaut
 * - Bouton "Tout sélectionner / Tout décocher"
 * - Toast de confirmation après rapatriement
 *
 * @module professional/reservations/components/GuestReservationsBanner
 */

'use client';

import { CalendarDays, MapPin, Users, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useGuestReservationsClaim } from '@/hooks/useGuestReservationsClaim';
import type { GuestReservation } from '@/lib/services/pro-reservations';

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  // timeStr format : "14:00:00" ou "14:00" (issu de sl.time::TEXT côté RPC)
  if (!timeStr || !timeStr.includes(':')) return '—';
  const [hours, minutes] = timeStr.split(':');
  return `${hours ?? '—'}h${minutes ?? '00'}`;
}

// ============================================
// LIGNE DE RÉSERVATION GUEST
// ============================================

interface GuestReservationRowProps {
  reservation: GuestReservation;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function GuestReservationRow({ reservation, isSelected, onToggle }: GuestReservationRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <Checkbox
        id={`guest-resa-${reservation.reservation_id}`}
        checked={isSelected}
        onCheckedChange={() => onToggle(reservation.reservation_id)}
        className="mt-0.5 shrink-0"
        aria-label={`Sélectionner la réservation pour ${reservation.show_title}`}
      />
      <label
        htmlFor={`guest-resa-${reservation.reservation_id}`}
        className="flex-1 min-w-0 cursor-pointer space-y-1"
      >
        <p className="font-medium text-sm text-derviche-dark truncate">{reservation.show_title}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3 shrink-0" aria-hidden="true" />
            {formatDate(reservation.slot_date)} à {formatTime(reservation.slot_time)}
          </span>
          {reservation.venue_name && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              {reservation.venue_name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="size-3 shrink-0" aria-hidden="true" />
            {reservation.num_places} place{reservation.num_places > 1 ? 's' : ''}
          </span>
        </div>
      </label>
      <Badge variant="outline" className="text-xs shrink-0">
        confirmée
      </Badge>
    </div>
  );
}

// ============================================
// BANNIÈRE PRINCIPALE
// ============================================

interface GuestReservationsBannerProps {
  /** Appelé après rapatriement réussi pour rafraîchir la liste des réservations */
  onClaimSuccess?: (count: number) => void;
}

export function GuestReservationsBanner({ onClaimSuccess }: GuestReservationsBannerProps) {
  const {
    guestReservations,
    isDetecting,
    isClaiming,
    selectedIds,
    isBannerVisible,
    toggleSelection,
    toggleAll,
    claimSelected,
    dismiss,
  } = useGuestReservationsClaim(onClaimSuccess);

  // Ne rien afficher pendant la détection ou si rien à afficher
  if (isDetecting || !isBannerVisible || guestReservations.length === 0) {
    return null;
  }

  const allSelected = selectedIds.size === guestReservations.length;
  const noneSelected = selectedIds.size === 0;

  async function handleClaim() {
    const result = await claimSelected();
    if (result.error) {
      toast.error('Erreur lors du rapatriement', { description: result.error });
    } else if (result.claimed > 0) {
      toast.success(
        result.claimed === 1
          ? '1 réservation retrouvée et ajoutée à votre compte'
          : `${result.claimed} réservations retrouvées et ajoutées à votre compte`
      );
    }
  }

  return (
    <div
      role="region"
      aria-label="Réservations précédentes à récupérer"
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3"
    >
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="font-semibold text-sm text-amber-900">
            {guestReservations.length === 1
              ? '1 réservation précédente trouvée'
              : `${guestReservations.length} réservations précédentes trouvées`}
          </p>
          <p className="text-xs text-amber-700">
            Ces réservations ont été effectuées avec votre adresse email avant la création de votre
            compte. Cochez celles que vous souhaitez récupérer.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-amber-700 hover:bg-amber-100"
          onClick={dismiss}
          aria-label="Fermer cette notification"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Liste des réservations */}
      <div className="bg-white rounded-md border border-amber-200 px-3 divide-y divide-amber-50">
        {guestReservations.map((reservation) => (
          <GuestReservationRow
            key={reservation.reservation_id}
            reservation={reservation}
            isSelected={selectedIds.has(reservation.reservation_id)}
            onToggle={toggleSelection}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          className="text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900"
          onClick={toggleAll}
          aria-label={allSelected ? 'Tout décocher les réservations' : 'Tout sélectionner les réservations'}
        >
          {allSelected ? 'Tout décocher' : 'Tout sélectionner'}
        </button>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
            onClick={dismiss}
          >
            Plus tard
          </Button>
          <Button
            size="sm"
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => void handleClaim()}
            disabled={isClaiming || noneSelected}
          >
            <Download className="size-3.5 mr-1.5" aria-hidden="true" />
            {isClaiming
              ? 'Récupération…'
              : selectedIds.size === 1
                ? 'Récupérer 1 réservation'
                : `Récupérer ${selectedIds.size} réservations`}
          </Button>
        </div>
      </div>
    </div>
  );
}
