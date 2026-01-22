/**
 * StatusBadge - Pastille de statut check-in
 * Derviche Diffusion
 * 
 * Affiche une pastille colorée selon le statut de présence
 * Interface mobile-first pour l'accueil sur place
 */

import { cn } from '@/lib/utils';
import type { CheckinStatus } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface StatusBadgeProps {
  /** Statut de check-in (null = non pointé) */
  status: CheckinStatus | null;
  /** Taille de la pastille */
  size?: 'sm' | 'md' | 'lg';
  /** Afficher le label textuel */
  showLabel?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

// ============================================
// CONFIGURATION
// ============================================

interface StatusConfig {
  symbol: string;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const STATUS_CONFIG: Record<CheckinStatus | 'pending', StatusConfig> = {
  pending: {
    symbol: '○',
    label: 'Non pointé',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-500',
    borderColor: 'border-gray-300',
  },
  present_loved: {
    symbol: '❤️',
    label: 'Coup de cœur',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-300',
  },
  present_press: {
    symbol: '📰',
    label: 'Presse',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
  },
  present_neutral: {
    symbol: '✓',
    label: 'Présent',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
  },
  absent: {
    symbol: '✗',
    label: 'Absent',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
  },
};

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

// ============================================
// COMPOSANT
// ============================================

export function StatusBadge({
  status,
  size = 'md',
  showLabel = false,
  className,
}: StatusBadgeProps) {
  // Utiliser 'pending' pour null (non pointé)
  const configKey = status ?? 'pending';
  const config = STATUS_CONFIG[configKey];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Pastille */}
      <div
        className={cn(
          'rounded-full flex items-center justify-center border',
          'font-medium shrink-0',
          SIZE_CLASSES[size],
          config.bgColor,
          config.textColor,
          config.borderColor
        )}
        role="status"
        aria-label={config.label}
      >
        {config.symbol}
      </div>

      {/* Label optionnel */}
      {showLabel && (
        <span className={cn('text-sm', config.textColor)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// ============================================
// VARIANTE COMPACTE (pour les listes)
// ============================================

export interface StatusDotProps {
  status: CheckinStatus | null;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const configKey = status ?? 'pending';
  const config = STATUS_CONFIG[configKey];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-5 h-5 rounded-full text-xs',
        config.bgColor,
        config.textColor,
        className
      )}
      role="status"
      aria-label={config.label}
    >
      {config.symbol}
    </span>
  );
}

// ============================================
// HELPERS EXPORTÉS
// ============================================

/**
 * Retourne la configuration d'un statut
 */
export function getStatusConfig(status: CheckinStatus | null): StatusConfig {
  return STATUS_CONFIG[status ?? 'pending'];
}

/**
 * Vérifie si un statut indique une présence
 */
export function isPresent(status: CheckinStatus | null): boolean {
  return status === 'present_loved' || status === 'present_press' || status === 'present_neutral';
}
