/**
 * ChartTooltip - Tooltip custom pour le BarChart des statistiques
 * Derviche Diffusion
 */

'use client';

interface TooltipPayload {
  value: number;
  payload: {
    bucketLabel: string;
  };
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

export function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const first = payload[0];
  if (!first) return null;

  const count = first.value ?? 0;
  const label = first.payload?.bucketLabel ?? '';

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {count} réservation{count > 1 ? 's' : ''}
      </p>
    </div>
  );
}
