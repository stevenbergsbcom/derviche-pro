import { Badge } from '@/components/ui/badge';
import type { ShowStatus } from '@/types/database';

export interface StatusBadgeProps {
  /** Statut à afficher */
  status: ShowStatus;
  /** Taille du badge */
  size?: 'sm' | 'default';
}

/** Configuration des statuts */
const STATUS_CONFIG: Record<ShowStatus, { label: string; className: string }> = {
  published: {
    label: 'Disponible',
    className: 'bg-green-500/10 text-green-700 border-green-500/20',
  },
  draft: {
    label: 'Bientôt',
    className: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  },
  archived: {
    label: 'Terminé',
    className: 'bg-red-500/10 text-red-700 border-red-500/20',
  },
};

/**
 * Badge de statut réutilisable pour les spectacles
 * 
 * @example
 * ```tsx
 * <StatusBadge status="published" />
 * <StatusBadge status="draft" size="sm" />
 * ```
 */
export function StatusBadge({ status, size = 'default' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  if (!config) return null;

  return (
    <Badge 
      className={`${config.className} ${size === 'sm' ? 'text-xs px-1.5 py-0.5' : ''}`}
    >
      {config.label}
    </Badge>
  );
}

/**
 * Exporte la config pour réutilisation (ex: dans les selects)
 */
export { STATUS_CONFIG };
