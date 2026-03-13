/**
 * Types partagés — Hooks App Settings
 * Derviche Diffusion — S186
 */

export interface UseAppSettingsReturn<T> {
  /** Valeur des paramètres */
  data: T | null;
  /** Chargement en cours */
  isLoading: boolean;
  /** Sauvegarde en cours */
  isSaving: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Mettre à jour les paramètres */
  update: (newValue: Partial<T>) => Promise<{ success: boolean; error?: string }>;
  /** Recharger depuis Supabase */
  refresh: () => Promise<void>;
}
