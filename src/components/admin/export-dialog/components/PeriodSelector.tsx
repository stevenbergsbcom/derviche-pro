/**
 * Sélecteur de période pour l'export
 * Affiche 3 boutons : Toutes, À venir, Passées
 */

import { memo } from 'react';
import { Calendar, CalendarCheck, CalendarX } from 'lucide-react';
import { Label } from '@/components/ui/label';
import type { PeriodSelectorProps, ExportPeriod } from '../types';
import { PERIOD_OPTIONS_DATA } from '../constants';

// ============================================
// ICONS PAR PÉRIODE
// ============================================

const PERIOD_ICONS: Record<ExportPeriod, React.ReactNode> = {
  all: <Calendar className="w-5 h-5" />,
  upcoming: <CalendarCheck className="w-5 h-5" />,
  past: <CalendarX className="w-5 h-5" />,
};

// ============================================
// COMPOSANT
// ============================================

export const PeriodSelector = memo(function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Période à exporter</Label>
      <div className="grid grid-cols-3 gap-2">
        {PERIOD_OPTIONS_DATA.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-label={`Exporter ${option.label.toLowerCase()}`}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors ${
                isSelected
                  ? 'border-derviche bg-derviche/5'
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
            >
              <span className={isSelected ? 'text-derviche' : 'text-muted-foreground'}>
                {PERIOD_ICONS[option.value]}
              </span>
              <span className="font-medium text-sm">{option.label}</span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight hidden sm:block">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

PeriodSelector.displayName = 'PeriodSelector';
