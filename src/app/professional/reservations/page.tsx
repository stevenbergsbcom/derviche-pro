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
import { ProReservationCard } from './components';
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
  const { reservations, isLoading, error, isCancelling, cancelReservation, refresh } =
    useProReservations();

  const upcoming = reservations.filter(isUpcoming);
  const history = reservations.filter(isHistory);

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

      {/* Erreur */}
      {error && !isLoading && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Une erreur est survenue lors du chargement de vos réservations.{' '}
          <button onClick={refresh} className="underline font-medium">
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
              <div className="space-y-3">
                {upcoming.map((reservation) => (
                  <ProReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    onCancel={cancelReservation}
                    isCancelling={isCancelling}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet Historique */}
          <TabsContent value="history">
            {history.length === 0 ? (
              <EmptyState type="history" />
            ) : (
              <div className="space-y-3">
                {history.map((reservation) => (
                  <ProReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    onCancel={cancelReservation}
                    isCancelling={isCancelling}
                  />
                ))}
              </div>
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
