/**
 * ShowDetailKpis - 5 mini-KPIs du drawer "Détail spectacle"
 * Derviche Diffusion
 */

'use client';

import { Ban, CheckCircle2, Newspaper, UserCheck, UserX } from 'lucide-react';
import type { ShowStats } from '@/lib/services/admin-stats';
import { ShowDetailKpiCard } from './show-detail-kpi-card';

export interface ShowDetailKpisProps {
  row: ShowStats;
}

export function ShowDetailKpis({ row }: ShowDetailKpisProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <ShowDetailKpiCard
        label="Confirmées"
        value={row.confirmedCount}
        icon={CheckCircle2}
        iconClassName="text-derviche"
      />
      <ShowDetailKpiCard
        label="Annulées"
        value={row.cancelledCount}
        icon={Ban}
        iconClassName="text-red-600"
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
