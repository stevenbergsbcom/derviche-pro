/**
 * StatsChart - Graphique d'évolution des réservations confirmées
 * Derviche Diffusion
 *
 * Bar chart (recharts) avec granularité automatique (jour/semaine/mois).
 * Section repliable avec header + bouton toggle.
 */

'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
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
  StatsChartPoint,
} from '@/lib/services/admin-stats';
import { ChartTooltip } from './chart-tooltip';

export interface StatsChartProps {
  data: StatsChartPoint[];
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

  return (
    <Card>
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
            <ResponsiveContainer width="100%" height={220}>
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
                <Bar
                  dataKey="confirmedCount"
                  fill="#1e3a5f"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      )}
    </Card>
  );
}
