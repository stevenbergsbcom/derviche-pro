/**
 * SortToggle - Bouton de tri réutilisable A→Z / Z→A
 * Derviche Diffusion
 *
 * Usage simple : un seul champ de tri avec toggle direction.
 */

'use client';

import { Button } from '@/components/ui/button';
import { ArrowDownAZ, ArrowUpZA } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc';

export interface SortToggleProps {
  /** Direction courante */
  direction: SortDirection;
  /** Callback quand on clique */
  onToggle: () => void;
  /** Label affiché (ex: "Nom", "Structure") */
  label?: string;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Bouton toggle A→Z / Z→A
 *
 * @example
 * <SortToggle direction={sortDir} onToggle={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} label="Nom" />
 */
export function SortToggle({ direction, onToggle, label, className }: SortToggleProps) {
  const isAsc = direction === 'asc';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className={cn('gap-1.5 shrink-0', className)}
      aria-label={`Trier ${label ? `par ${label} ` : ''}${isAsc ? 'Z→A' : 'A→Z'} (actuellement ${isAsc ? 'A→Z' : 'Z→A'})`}
      aria-pressed={true}
      title={isAsc ? 'Trier Z→A' : 'Trier A→Z'}
    >
      {isAsc ? (
        <ArrowDownAZ className="w-4 h-4" aria-hidden="true" />
      ) : (
        <ArrowUpZA className="w-4 h-4" aria-hidden="true" />
      )}
      {label && <span className="hidden sm:inline">{label}</span>}
    </Button>
  );
}
