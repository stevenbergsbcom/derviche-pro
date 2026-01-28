/**
 * Constantes pour les dialogs de représentations
 * Derviche Diffusion
 */

import type { GenerateSeriesData } from './types';

// ============================================
// LABELS
// ============================================

/** Labels des jours de la semaine (Dim = index 0) */
export const WEEK_DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const;

/** Labels des jours complets pour le formatage */
export const WEEK_DAY_LABELS_FULL = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'] as const;

/** Noms des mois en français */
export const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
] as const;

// ============================================
// VALEURS PAR DÉFAUT
// ============================================

/** Valeurs par défaut pour la génération de série */
export const DEFAULT_SERIES_DATA: GenerateSeriesData = {
  startDate: '',
  endDate: '',
  weekDays: [true, true, true, true, true, true, true],
  times: ['11:00'],
  excludedDates: [],
  venueId: '',
  capacity: null,
  isUnlimited: true,
  hostedBy: 'derviche',
  hostedById: null,
  includeExactDuplicates: false,
  includeConflicts: false,
};

/** Horaire par défaut pour un nouveau créneau */
export const DEFAULT_TIME = '11:00';

/** Capacité par défaut quand on désactive "illimité" */
export const DEFAULT_CAPACITY = 20;
