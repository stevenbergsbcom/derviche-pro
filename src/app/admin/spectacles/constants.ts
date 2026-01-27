/**
 * Constantes pour la page admin/spectacles
 */

import type { ViewMode } from './types';

/**
 * Mode d'affichage par défaut
 */
export const DEFAULT_VIEW_MODE: ViewMode = 'list';

/**
 * Durée d'affichage du feedback de copie (ms)
 */
export const COPY_FEEDBACK_DURATION = 2000;

/**
 * Délai avant réouverture de la vue après édition (ms)
 */
export const REOPEN_VIEW_DELAY = 100;

/**
 * Configuration des statuts pour l'affichage
 */
export const STATUS_CONFIG = {
  published: {
    label: 'Disponible',
    bgClass: 'bg-green-500',
    textClass: 'text-white',
  },
  draft: {
    label: 'Bientôt',
    bgClass: 'bg-orange-500',
    textClass: 'text-white',
  },
  archived: {
    label: 'Terminé',
    bgClass: 'bg-red-500',
    textClass: 'text-white',
  },
} as const;

/**
 * Obtenir la configuration d'un statut
 */
export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
}
