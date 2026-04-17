/**
 * ShowDetailKpiCard - Mini-carte KPI réutilisée par les drawers détail
 * Derviche Diffusion
 *
 * Format compact adapté aux panneaux latéraux (colonne étroite).
 * Partagé entre le drawer "Détail spectacle" et "Détail lieu".
 */

'use client';

import type { LucideIcon } from 'lucide-react';

export interface ShowDetailKpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName?: string;
}

export function ShowDetailKpiCard({
  label,
  value,
  icon: Icon,
  iconClassName = 'text-derviche',
}: ShowDetailKpiCardProps) {
  return (
    <div className="rounded-md border bg-card/60 px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${iconClassName}`} aria-hidden="true" />
        <span className="text-lg font-bold tabular-nums">
          {value.toLocaleString('fr-FR')}
        </span>
      </div>
    </div>
  );
}
