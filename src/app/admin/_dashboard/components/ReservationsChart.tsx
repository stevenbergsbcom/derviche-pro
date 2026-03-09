/**
 * ReservationsChart - Admin Dashboard
 * Derviche Diffusion
 *
 * Graphique area d'évolution des réservations sur la période sélectionnée.
 * Utilise recharts (AreaChart).
 */

'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import type { ReservationChartPoint, DashboardPeriod } from '@/lib/services/admin-dashboard';

// ============================================
// HELPERS
// ============================================

function getPeriodLabel(period: DashboardPeriod): string {
  switch (period) {
    case '7d':
      return '7 derniers jours';
    case '30d':
      return '30 derniers jours';
    case 'season':
      return 'Cette saison';
  }
}

/**
 * Pour la saison, on a potentiellement 300+ points.
 * On réduit l'affichage des ticks XAxis pour éviter la surcharge.
 */
function getXAxisInterval(dataLength: number): number | 'preserveStartEnd' {
  if (dataLength <= 14) return 0;
  if (dataLength <= 31) return 2;
  if (dataLength <= 90) return 6;
  return Math.floor(dataLength / 10);
}

// ============================================
// TOOLTIP PERSONNALISÉ
// ============================================

interface TooltipPayload {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const count = payload[0]?.value ?? 0;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {count} réservation{count > 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

interface ReservationsChartProps {
  data: ReservationChartPoint[];
  period: DashboardPeriod;
  isLoading: boolean;
}

export function ReservationsChart({ data, period, isLoading }: ReservationsChartProps) {
  const totalReservations = data.reduce((sum, point) => sum + point.count, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-4 w-4 text-derviche" />
            Évolution des réservations
          </CardTitle>
          {!isLoading && (
            <span className="text-sm text-muted-foreground">
              {getPeriodLabel(period)} · {totalReservations} au total
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Aucune donnée pour cette période
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reservationsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
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
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#1e3a5f"
                strokeWidth={2}
                fill="url(#reservationsGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#1e3a5f', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
