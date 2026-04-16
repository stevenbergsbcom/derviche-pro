/**
 * VenueDetailKpis - 6 mini-KPIs du drawer "Détail lieu"
 * Derviche Diffusion
 *
 * Réutilise `ShowDetailKpiCard` (même format compact).
 */

'use client';

import { Calendar, CheckCircle2, Film, Newspaper, UserCheck, UserX } from 'lucide-react';
import type { VenueStats } from '@/lib/services/admin-stats';
import { ShowDetailKpiCard } from '../show-detail/show-detail-kpi-card';

export interface VenueDetailKpisProps {
  row: VenueStats;
}

export function VenueDetailKpis({ row }: VenueDetailKpisProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <ShowDetailKpiCard
        label="Représentations"
        value={row.representationsCount}
        icon={Calendar}
        iconClassName="text-derviche"
      />
      <ShowDetailKpiCard
        label="Spectacles"
        value={row.showsCount}
        icon={Film}
        iconClassName="text-blue-600"
      />
      <ShowDetailKpiCard
        label="Confirmées"
        value={row.confirmedCount}
        icon={CheckCircle2}
        iconClassName="text-derviche"
      />
      <ShowDetailKpiCard
        label="Présents"
        value={row.presentCount}
        icon={UserCheck}
        iconClassName="text-green-600"
      />
      <ShowDetailKpiCard
        label="Absents"
        value={row.absentCount}
        icon={UserX}
        iconClassName="text-orange-600"
      />
      <ShowDetailKpiCard
        label="Presse"
        value={row.pressCount}
        icon={Newspaper}
        iconClassName="text-blue-600"
      />
    </div>
  );
}
