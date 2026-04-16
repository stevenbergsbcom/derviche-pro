/**
 * StatsChart - Graphique d'évolution des réservations confirmées
 * Derviche Diffusion
 *
 * Bar chart (recharts) avec granularité automatique (jour/semaine/mois).
 * Section repliable avec header + bouton toggle.
 *
 * Phase 3 : supporte une 2ᵉ série "comparaison" conditionnelle (dérivée de
 * la présence de `confirmedCountCompare` sur les points) + légende.
 */

'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  ChartGranularity,
  StatsChartPointWithCompare,
} from '@/lib/services/admin-stats';
import { CHART_COLORS } from '@/lib/services/admin-stats';
import { ChartTooltip } from './chart-tooltip';

export interface StatsChartProps {
  data: StatsChartPointWithCompare[];
  granularity: ChartGranularity;
  isLoading: boolean;
}

const GRANULARITY_LABELS: Record<ChartGranularity, string> = {
  day: 'Par jour',
  week: 'Par semaine',
  month: 'Par mois',
};

/**
 * Calcule l'intervalle d'affichage des ticks XAxis pour éviter la surcharge
 * quand on a beaucoup de buckets (p.ex. "Tout" en granularité jour).
 */
function getXAxisInterval(dataLength: number): number | 'preserveStartEnd' {
  if (dataLength <= 14) return 0;
  if (dataLength <= 31) return 2;
  if (dataLength <= 90) return 6;
  return Math.floor(dataLength / 10);
}

export function StatsChart({ data, granularity, isLoading }: StatsChartProps) {
  const [collapsed, setCollapsed] = useState(false);

  const total = data.reduce((sum, p) => sum + p.confirmedCount, 0);

  // Déduit la présence d'une série de comparaison depuis les données : évite
  // d'exiger une prop supplémentaire côté page.
  const hasCompare = data.some((p) => typeof p.confirmedCountCompare === 'number');

  return (
    <Card data-pdf-chart="true">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-4 w-4 text-derviche" />
            Évolution des réservations
          </CardTitle>
          <div className="flex items-center gap-3">
            {!isLoading && !collapsed && (
              <span className="text-sm text-muted-foreground">
                {GRANULARITY_LABELS[granularity]} · {total} au total
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((c) => !c)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Déplier le graphique' : 'Replier le graphique'}
            >
              {collapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : data.length === 0 || total === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Aucune donnée pour cette période
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={hasCompare ? 250 : 220}>
              <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="bucketLabel"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  interval={getXAxisInterval(data.length)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                  content={<ChartTooltip />}
                />
                {hasCompare && (
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="rect" />
                )}
                <Bar
                  dataKey="confirmedCount"
                  name="Période courante"
                  fill={CHART_COLORS.main}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                {hasCompare && (
                  <Bar
                    dataKey="confirmedCountCompare"
                    name="Comparaison"
                    fill={CHART_COLORS.compare}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      )}
    </Card>
  );
}
