/**
 * ChartTooltip - Tooltip custom pour le BarChart des statistiques
 * Derviche Diffusion
 *
 * Supporte l'affichage combiné période courante + période de comparaison
 * (Phase 3).
 */

'use client';

interface TooltipPayloadEntry {
  value: number;
  dataKey?: string;
  name?: string;
  color?: string;
  payload: {
    bucketLabel: string;
    bucketLabelCompare?: string;
    confirmedCount?: number;
    confirmedCountCompare?: number;
  };
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

export function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const first = payload[0];
  if (!first) return null;

  const mainLabel = first.payload?.bucketLabel ?? '';
  const mainCount = first.payload?.confirmedCount ?? 0;
  const compareCount = first.payload?.confirmedCountCompare;
  const compareLabel = first.payload?.bucketLabelCompare;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{mainLabel}</p>
      <p className="text-muted-foreground">
        {mainCount} réservation{mainCount > 1 ? 's' : ''}
      </p>
      {typeof compareCount === 'number' && (
        <p className="mt-1 border-t pt-1 text-xs text-muted-foreground">
          <span className="font-medium">{compareLabel ?? 'Comparaison'}</span> ·{' '}
          {compareCount} réservation{compareCount > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
