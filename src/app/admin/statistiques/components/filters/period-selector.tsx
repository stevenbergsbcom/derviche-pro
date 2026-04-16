/**
 * PeriodSelector - Sélection de la période de stats
 * Derviche Diffusion
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StatsPeriod } from '@/lib/services/admin-stats';
import { STATS_PERIOD_LABELS } from '@/lib/services/admin-stats';

// ============================================
// TYPES
// ============================================

export interface PeriodSelectorProps {
  period: StatsPeriod;
  from?: string;
  to?: string;
  onPeriodChange: (period: StatsPeriod) => void;
  onCustomRangeChange: (from: string, to: string) => void;
}

// ============================================
// CONSTANTES
// ============================================

const PERIOD_OPTIONS: StatsPeriod[] = [
  'month_current',
  'month_previous',
  'season_current',
  'year_current',
  'all',
  'custom',
];

// ============================================
// COMPOSANT
// ============================================

export function PeriodSelector({
  period,
  from,
  to,
  onPeriodChange,
  onCustomRangeChange,
}: PeriodSelectorProps) {
  const [localFrom, setLocalFrom] = useState(from ?? '');
  const [localTo, setLocalTo] = useState(to ?? '');

  useEffect(() => setLocalFrom(from ?? ''), [from]);
  useEffect(() => setLocalTo(to ?? ''), [to]);

  const commitCustom = (newFrom: string, newTo: string) => {
    if (newFrom && newTo) {
      onCustomRangeChange(newFrom, newTo);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor="stats-period" className="text-xs text-muted-foreground">
          Période
        </Label>
        <Select
          value={period}
          onValueChange={(value) => onPeriodChange(value as StatsPeriod)}
        >
          <SelectTrigger id="stats-period" className="min-w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {STATS_PERIOD_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {period === 'custom' && (
        <>
          <div className="flex flex-col gap-1">
            <Label htmlFor="stats-from" className="text-xs text-muted-foreground">
              Du
            </Label>
            <Input
              id="stats-from"
              type="date"
              value={localFrom}
              onChange={(e) => {
                setLocalFrom(e.target.value);
                commitCustom(e.target.value, localTo);
              }}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="stats-to" className="text-xs text-muted-foreground">
              Au
            </Label>
            <Input
              id="stats-to"
              type="date"
              value={localTo}
              onChange={(e) => {
                setLocalTo(e.target.value);
                commitCustom(localFrom, e.target.value);
              }}
              className="w-40"
            />
          </div>
        </>
      )}
    </div>
  );
}
