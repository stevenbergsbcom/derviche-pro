/**
 * Page Mes réservations — Espace Professionnel
 * Derviche Pro — Session 122
 *
 * Affiche les réservations du programmateur connecté en 2 onglets :
 * - À venir : confirmed/waitlist dont la date est >= aujourd'hui
 * - Historique : annulées + dates passées
 */

'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProReservations } from '@/hooks';
import { ProReservationCard, GuestReservationsBanner } from './components';
import type { ProReservation } from '@/lib/services/pro-reservations';

// ============================================
// HELPERS
// ============================================

function isUpcoming(reservation: ProReservation): boolean {
  if (reservation.status === 'cancelled' || reservation.status === 'no_show') return false;
  const slotDate = new Date(`${reservation.slot.date}T${reservation.slot.time}`);
  return slotDate >= new Date();
}

function isHistory(reservation: ProReservation): boolean {
  return !isUpcoming(reservation);
}

/**
 * Trie les réservations par date de créneau décroissante (la plus récente en premier)
 * utilisé pour l'onglet Historique
 */
function sortBySlotDateDesc(a: ProReservation, b: ProReservation): number {
  const dateA = new Date(`${a.slot.date}T${a.slot.time}`);
  const dateB = new Date(`${b.slot.date}T${b.slot.time}`);
  return dateB.getTime() - dateA.getTime();
}

// ============================================
// COMPOSANT SKELETON
// ============================================

function ReservationSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-36 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ============================================
// COMPOSANT LISTE AVEC EN-TÊTE DESKTOP
// ============================================

interface ReservationListProps {
  reservations: ProReservation[];
  onCancel: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  isCancelling: boolean;
  onChangeSlot: (reservationId: string, newSlotId: string) => Promise<{ success: boolean; error?: string }>;
  isChangingSlot: boolean;
}

function ReservationList({ reservations, onCancel, isCancelling, onChangeSlot, isChangingSlot }: ReservationListProps) {
  return (
    <div className="space-y-2">
      {/* En-tête colonnes — desktop uniquement */}
      <div className="hidden lg:flex items-center gap-4 px-5 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <div className="w-1 shrink-0" />{/* placeholder barre statut */}
        <div className="flex-1">Spectacle</div>
        <div className="w-52 shrink-0">Date &amp; heure</div>
        <div className="w-44 shrink-0">Lieu</div>
        <div className="w-20 shrink-0">Places</div>
        <div className="w-28 shrink-0 text-center">Statut</div>
        <div className="w-56 shrink-0" />{/* placeholder actions — aligné sur la largeur réelle des boutons */}
      </div>
      {/* Liste */}
      {reservations.map((reservation) => (
        <ProReservationCard
          key={reservation.id}
          reservation={reservation}
          onCancel={onCancel}
          isCancelling={isCancelling}
          onChangeSlot={onChangeSlot}
          isChangingSlot={isChangingSlot}
        />
      ))}
    </div>
  );
}

// ============================================
// COMPOSANT LISTE VIDE
// ============================================

function EmptyState({ type }: { type: 'upcoming' | 'history' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <p className="text-muted-foreground">
        {type === 'upcoming'
          ? 'Vous n\'avez aucune réservation à venir.'
          : 'Aucune réservation dans votre historique.'}
      </p>
      {type === 'upcoming' && (
        <Button asChild>
          <Link href="/catalogue">Découvrir les spectacles</Link>
        </Button>
      )}
    </div>
  );
}

// ============================================
// PAGE
// ============================================

export default function ProfessionalReservationsPage() {
  const { reservations, isLoading, error, isCancelling, isChangingSlot, cancelReservation, changeSlot, refresh } =
    useProReservations();

  // À venir : tri ASC par date de créneau (depuis la query)
  const upcoming = reservations.filter(isUpcoming);
  // Historique : on inverse l'ordre — la représentation la plus récente en premier
  const history = reservations.filter(isHistory).sort(sortBySlotDateDesc);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-derviche-dark">Mes réservations</h1>
          <p className="text-muted-foreground">Gérez vos réservations de spectacles</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          aria-label="Actualiser les réservations"
        >
          <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span className="hidden sm:inline ml-2">Actualiser</span>
        </Button>
      </div>

      {/* Bannière rapatriement réservations guest */}
      <GuestReservationsBanner onClaimSuccess={refresh} />

      {/* Erreur */}
      {error && !isLoading && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Une erreur est survenue lors du chargement de vos réservations.{' '}
          <button
            onClick={refresh}
            className="underline font-medium"
            aria-label="Réessayer de charger les réservations"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Contenu */}
      {isLoading ? (
        <ReservationSkeleton />
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">
              À venir
              {upcoming.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium">
                  {upcoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">
              Historique
              {history.length > 0 && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {history.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Onglet À venir */}
          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <EmptyState type="upcoming" />
            ) : (
              <ReservationList
                reservations={upcoming}
                onCancel={cancelReservation}
                isCancelling={isCancelling}
                onChangeSlot={changeSlot}
                isChangingSlot={isChangingSlot}
              />
            )}
          </TabsContent>

          {/* Onglet Historique */}
          <TabsContent value="history">
            {history.length === 0 ? (
              <EmptyState type="history" />
            ) : (
              <ReservationList
                reservations={history}
                onCancel={cancelReservation}
                isCancelling={isCancelling}
                onChangeSlot={changeSlot}
                isChangingSlot={isChangingSlot}
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Lien catalogue (toujours visible) */}
      {!isLoading && (
        <div className="border-t pt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Vous souhaitez découvrir d&apos;autres spectacles ?
          </p>
          <Button variant="outline" asChild>
            <Link href="/catalogue">Voir le catalogue complet</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
