'use client';

/**
 * Admin Dashboard Page
 * Derviche Diffusion
 *
 * Page d'accueil de l'interface d'administration
 * Orchestrateur léger - logique déléguée aux hooks et composants
 */

import { useMemo } from 'react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useUserFirstName } from '@/hooks/useUserFirstName';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Theater, CalendarDays, Ticket, Users, RefreshCw } from 'lucide-react';

// Imports locaux
import { QUICK_LINKS } from './_dashboard/constants';
import { formatTodayDate } from './_dashboard/helpers';
import {
  StatCard,
  StatsSkeleton,
  QuickLink,
  UpcomingSlotsCard,
  RecentReservationsCard,
} from './_dashboard/components';

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function AdminDashboardPage() {
  const { data, isLoading, error, hasFullAccess, refresh } = useAdminDashboard();
  const { firstName } = useUserFirstName();

  // Filtrer les liens d'accès rapide selon les permissions
  const filteredQuickLinks = useMemo(
    () => QUICK_LINKS.filter((link) => !link.requiresFullAccess || hasFullAccess),
    [hasFullAccess]
  );

  return (
    <div className="space-y-6">
      {/* En-tête avec salutation */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-derviche-dark">
            Bonjour{firstName ? ` ${firstName}` : ''} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Nous sommes le {formatTodayDate()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          disabled={isLoading}
          aria-label="Actualiser le tableau de bord"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      {isLoading ? (
        <StatsSkeleton />
      ) : data?.stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Spectacles actifs"
            value={data.stats.total_shows_active}
            description={hasFullAccess ? 'Publiés sur le catalogue' : 'Vos spectacles assignés'}
            icon={Theater}
          />
          <StatCard
            title="Créneaux à venir"
            value={data.stats.total_slots_upcoming}
            description="Représentations programmées"
            icon={CalendarDays}
          />
          <StatCard
            title="Réservations"
            value={data.stats.total_reservations}
            description={`${data.stats.reservations_today} aujourd'hui, ${data.stats.reservations_this_week} cette semaine`}
            icon={Ticket}
            trend={
              data.stats.reservations_today > 0
                ? { value: data.stats.reservations_today, label: "aujourd'hui" }
                : undefined
            }
          />
          <StatCard
            title="Taux de remplissage"
            value={`${data.stats.average_occupancy_rate}%`}
            description="Moyenne créneaux à venir"
            icon={Users}
          />
        </div>
      ) : null}

      {/* Accès rapides */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Accès rapides</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filteredQuickLinks.map((link) => (
            <QuickLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              title={link.title}
              description={link.description}
            />
          ))}
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingSlotsCard
          slots={data?.upcomingSlots ?? []}
          isLoading={isLoading}
          hasFullAccess={hasFullAccess}
        />
        <RecentReservationsCard
          reservations={data?.recentReservations ?? []}
          isLoading={isLoading}
          hasFullAccess={hasFullAccess}
        />
      </div>
    </div>
  );
}
