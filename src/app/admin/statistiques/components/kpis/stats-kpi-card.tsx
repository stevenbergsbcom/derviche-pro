/**
 * StatsKpiCard - Une carte KPI
 * Derviche Diffusion
 */

'use client';

import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DeltaValue } from '@/lib/services/admin-stats';
import { StatsKpiDelta } from './stats-kpi-delta';

export interface StatsKpiCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconClassName?: string;
  sublabel?: string;
  isLoading?: boolean;
  /** Valeur delta (mode comparaison). Optionnel. */
  delta?: DeltaValue;
  /** Inverse la logique couleur du delta (ex: annulations). */
  deltaInverse?: boolean;
}

export function StatsKpiCard({
  title,
  value,
  icon: Icon,
  iconClassName = 'text-derviche',
  sublabel,
  isLoading,
  delta,
  deltaInverse,
}: StatsKpiCardProps) {
  return (
    <Card className="py-1 bg-card/80 border-muted-foreground/10">
      <CardContent className="px-3 py-2">
        <p className="text-xs md:text-sm font-medium text-muted-foreground">{title}</p>
        <div className="mt-1 flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconClassName}`} aria-hidden="true" />
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <span className="text-xl md:text-2xl font-bold">
              {value.toLocaleString('fr-FR')}
            </span>
          )}
        </div>
        {sublabel && (
          <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
        )}
        {delta && !isLoading && (
          <div className="mt-1">
            <StatsKpiDelta value={delta} inverse={deltaInverse} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
