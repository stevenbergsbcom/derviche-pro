/**
 * Constantes pour la page des représentations
 */

/**
 * Valeur représentant une capacité illimitée dans la base de données
 * Utilisée car la contrainte SQL requiert capacity > 0
 */
export const UNLIMITED_CAPACITY = 999999;

/**
 * Expression régulière pour valider un UUID v4
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Noms des jours de la semaine en français (abrégés)
 */
export const DAYS_FR = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'] as const;

/**
 * Noms des mois en français (minuscules)
 */
export const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

/**
 * Noms des mois en français (capitalisés)
 */
export const MONTHS_FR_CAPITALIZED = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

/**
 * Couleurs pour la barre de capacité selon le pourcentage de remplissage
 */
export const CAPACITY_COLORS = {
  HIGH: 'bg-green-500',    // >= 50%
  MEDIUM: 'bg-orange-500', // >= 20%
  LOW: 'bg-red-500',       // < 20%
  EMPTY: 'bg-muted',       // null (illimité)
} as const;

/**
 * Seuils de pourcentage pour les couleurs de capacité
 */
export const CAPACITY_THRESHOLDS = {
  HIGH: 50,
  MEDIUM: 20,
} as const;
