/**
 * Dashboard Professionnel — Page principale
 * Derviche Diffusion
 *
 * Affiche :
 *   - Salutation personnalisée avec date du jour
 *   - Card "Prochain spectacle" (ou état vide + CTA)
 *   - Colonne droite : prochaines réservations + spectacles à découvrir
 */

'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProDashboard } from '@/hooks/useProDashboard';
import { useUserFirstName } from '@/hooks/useUserFirstName';
import { NextShowCard } from './_dashboard/NextShowCard';
import { UpcomingReservationsCard } from './_dashboard/UpcomingReservationsCard';
import { DiscoverShowsCard } from './_dashboard/DiscoverShowsCard';

// ============================================
// HELPER DATE
// ============================================

function todayFormatted(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ============================================
// PAGE
// ============================================

export default function ProfessionalPage() {
  const { data, isLoading, error, refresh } = useProDashboard();
  const { firstName } = useUserFirstName();

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-derviche-dark">
            Bonjour{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {todayFormatted()}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          disabled={isLoading}
          className="gap-2 self-start"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* ── Erreur globale ── */}
      {error && !isLoading && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          Une erreur est survenue : {error}
        </div>
      )}

      {/* ── Card prochain spectacle (pleine largeur) ── */}
      <NextShowCard
        reservation={data?.nextReservation ?? null}
        isLoading={isLoading}
      />

      {/* ── Grille 2 colonnes ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UpcomingReservationsCard
          reservations={data?.upcomingReservations ?? []}
          isLoading={isLoading}
        />

        <DiscoverShowsCard
          shows={data?.discoverShows ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
