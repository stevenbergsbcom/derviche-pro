/**
 * Types partagés — Section Classement
 * Derviche Diffusion — Migration 111
 */

import type { ShowRanking } from '@/lib/services/shows/ranking';

/** Props de la section racine (alignées sur les autres sections preferences). */
export interface ClassementSectionProps {
  canEdit: boolean;
  onDirtyChange: (isDirty: boolean) => void;
}

/** Props partagées par les deux zones (Featured + GlobalOrder). */
export interface ZoneProps {
  shows: ShowRanking[];
  isLoading: boolean;
  canEdit: boolean;
}
