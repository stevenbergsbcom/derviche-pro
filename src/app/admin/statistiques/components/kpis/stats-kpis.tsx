/**
 * StatsKpis - Grille des 4 KPIs principaux
 * Derviche Diffusion
 */

'use client';

import { Users, Ticket, Ban, Film } from 'lucide-react';
import type { StatsKpis as StatsKpisData } from '@/lib/services/admin-stats';
import { StatsKpiCard } from './stats-kpi-card';

export interface StatsKpisProps {
  kpis: StatsKpisData | null;
  isLoading: boolean;
}

export function StatsKpis({ kpis, isLoading }: StatsKpisProps) {
  const data: StatsKpisData = kpis ?? {
    totalConfirmed: 0,
    totalCancelled: 0,
    totalPlacesConfirmed: 0,
    totalShows: 0,
  };

  const avgPlaces =
    data.totalConfirmed > 0
      ? (data.totalPlacesConfirmed / data.totalConfirmed).toFixed(1)
      : '0';

  const totalWithCancelled = data.totalConfirmed + data.totalCancelled;
  const cancelRate =
    totalWithCancelled > 0
      ? Math.round((data.totalCancelled / totalWithCancelled) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatsKpiCard
        title="Réservations confirmées"
        value={data.totalConfirmed}
        icon={Users}
        iconClassName="text-derviche"
        sublabel="hors annulées"
        isLoading={isLoading}
      />
      <StatsKpiCard
        title="Annulations"
        value={data.totalCancelled}
        icon={Ban}
        iconClassName="text-red-600"
        sublabel={`${cancelRate}% du volume total`}
        isLoading={isLoading}
      />
      <StatsKpiCard
        title="Places confirmées"
        value={data.totalPlacesConfirmed}
        icon={Ticket}
        iconClassName="text-green-600"
        sublabel={`moy. ${avgPlaces} / résa`}
        isLoading={isLoading}
      />
      <StatsKpiCard
        title="Spectacles concernés"
        value={data.totalShows}
        icon={Film}
        iconClassName="text-blue-600"
        sublabel="sur la période"
        isLoading={isLoading}
      />
    </div>
  );
}
