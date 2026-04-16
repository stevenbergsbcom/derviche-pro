/**
 * StatsKpiDelta - Badge d'évolution (delta + %)
 * Derviche Diffusion
 *
 * Composant réutilisable pour afficher un DeltaValue avec icône directionnelle
 * et coloration sémantique. Utilisé dans les KPI cards et dans les colonnes
 * "Évolution" des tableaux shows/venues.
 */

'use client';

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeltaValue } from '@/lib/services/admin-stats';

export interface StatsKpiDeltaProps {
  value?: DeltaValue;
  /** Inverser la logique couleur (ex: annulations — + = mauvaise nouvelle). */
  inverse?: boolean;
  className?: string;
}

export function StatsKpiDelta({ value, inverse, className }: StatsKpiDeltaProps) {
  if (!value) return null;

  const { delta, deltaPercent, compareValue } = value;
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;

  const isPositive = inverse ? delta < 0 : delta > 0;
  const isNegative = inverse ? delta > 0 : delta < 0;

  const colorClass = isPositive
    ? 'text-emerald-600'
    : isNegative
      ? 'text-red-600'
      : 'text-muted-foreground';

  const sign = delta > 0 ? '+' : '';
  const percentText =
    deltaPercent === null
      ? '—'
      : `${deltaPercent > 0 ? '+' : ''}${deltaPercent}%`;

  // aria-label enrichi avec la valeur de référence pour un rendu audio complet
  // (ex. "Évolution : +15 (+12%) par rapport à 125")
  const ariaLabel = `Évolution : ${sign}${delta} (${percentText}) par rapport à ${compareValue}`;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium tabular-nums',
        colorClass,
        className,
      )}
      aria-label={ariaLabel}
    >
      <Icon className="h-3 w-3" aria-hidden />
      <span>
        {sign}
        {delta}
      </span>
      <span className="text-muted-foreground">({percentText})</span>
    </div>
  );
}
