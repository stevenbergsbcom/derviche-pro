/**
 * Types UI locaux - /admin/statistiques
 */

/** Option d'une liste de sélection (compagnies, lieux). */
export interface SelectOption {
  id: string;
  label: string;
  /** Sous-ligne optionnelle (ex: ville pour un lieu). */
  sublabel?: string;
}
