/**
 * Types partagés — Cards homepage
 * Derviche Diffusion
 */

import type { HomepageSettings } from '@/lib/services/app-settings';

/** Props communes à toutes les cards homepage. */
export interface CardProps {
  data: HomepageSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  canEdit: boolean;
  onUpdate: (value: Partial<HomepageSettings>) => Promise<{ success: boolean; error?: string }>;
  onDirtyChange: (isDirty: boolean) => void;
}
