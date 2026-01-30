/**
 * Constantes pour la page réservations compagnie
 * Derviche Diffusion - Session 117
 */

import type { CompanyExportColumn } from '@/lib/services/company-reservations';

// ============================================
// COLONNES
// ============================================

/**
 * Colonnes visibles par défaut dans le tableau compagnie
 * (lecture seule, pas de colonne actions)
 */
export const DEFAULT_VISIBLE_COLUMNS: CompanyExportColumn[] = [
  'date',
  'spectacle',
  'lastName',
  'firstName',
  'email',
  'numPlaces',
  'status',
  'checkinStatus',
] as const;

// ============================================
// PAGINATION
// ============================================

/**
 * Taille de page par défaut
 */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Options de taille de page disponibles
 */
export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

/**
 * Nombre maximum de pages à afficher dans la pagination
 */
export const MAX_VISIBLE_PAGES = 5;

// ============================================
// FILTRES
// ============================================

/**
 * Période par défaut à l'initialisation
 */
export const DEFAULT_PERIOD = 'upcoming' as const;

/**
 * Tri par défaut
 */
export const DEFAULT_SORT = 'slot_date_asc' as const;

/**
 * Presets de dates rapides
 */
export const DATE_PRESETS = [
  { value: 'this_week', label: 'Cette semaine' },
  { value: 'this_month', label: 'Ce mois' },
  { value: 'next_month', label: 'Mois prochain' },
] as const;

// ============================================
// CHECK-IN OPTIONS
// ============================================

/**
 * Options de filtre check-in avec emojis
 */
export const CHECKIN_FILTER_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'present_loved', label: '❤️ A aimé' },
  { value: 'present_press', label: '📰 Presse' },
  { value: 'present_neutral', label: '😐 Neutre' },
  { value: 'absent', label: '❌ Absent' },
] as const;

/**
 * Options de filtre statut
 */
export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'cancelled', label: 'Annulées' },
] as const;

/**
 * Options de filtre période
 */
export const PERIOD_FILTER_OPTIONS = [
  { value: 'all', label: 'Toutes les périodes' },
  { value: 'upcoming', label: 'À venir' },
  { value: 'past', label: 'Passées' },
] as const;
