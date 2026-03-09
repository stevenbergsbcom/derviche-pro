/**
 * PeriodSelector - Admin Dashboard
 * Derviche Diffusion
 *
 * Sélecteur de période pour le dashboard : 7j / 30j / Saison
 */

'use client';

import { Button } from '@/components/ui/button';
import type { DashboardPeriod } from '@/lib/services/admin-dashboard';

interface PeriodSelectorProps {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
  disabled?: boolean;
}

const PERIODS: { id: DashboardPeriod; label: string }[] = [
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: 'season', label: 'Saison' },
];

export function PeriodSelector({ value, onChange, disabled = false }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
      {PERIODS.map((p) => (
        <Button
          key={p.id}
          variant={value === p.id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(p.id)}
          disabled={disabled}
          className={
            value === p.id
              ? 'bg-derviche text-white hover:bg-derviche/90 h-7 px-3 text-xs'
              : 'h-7 px-3 text-xs text-muted-foreground'
          }
          aria-pressed={value === p.id}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
