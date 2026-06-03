'use client';

/**
 * Hooks specialises pour les mutations de preferences utilisateur
 * Derviche Diffusion
 */

import { useUserPreference } from './use-preference-queries';
import type {
  ReservationColumnsPreference,
  ProfessionalColumn,
  CompanyReservationColumnsPreference,
} from './types';
import {
  DEFAULT_COLUMNS_ORDER,
  DEFAULT_COLUMNS_PREFERENCE,
  DEFAULT_PROFESSIONAL_VISIBLE_COLUMNS,
  DEFAULT_COMPANY_COLUMNS_ORDER,
  DEFAULT_COMPANY_COLUMNS_PREFERENCE,
} from './constants';

/**
 * Hook specialise pour les colonnes de reservations admin (ordre + visibilite)
 */
export function useReservationColumnsPreference() {
  const {
    value,
    isLoading,
    error,
    setValue: setPreference,
    refresh,
  } = useUserPreference<ReservationColumnsPreference>(
    'admin_reservations_columns',
    DEFAULT_COLUMNS_PREFERENCE
  );

  // Assurer la compatibilite avec l'ancien format (tableau simple)
  let normalizedValue: ReservationColumnsPreference = Array.isArray(value)
    ? { order: DEFAULT_COLUMNS_ORDER, visible: value }
    : value;

  // Sessions A+B (retour audit Cursor P2) — purger les colonnes obsolètes
  // ET ajouter les nouvelles. Sans la purge, un admin qui avait activé
  // `crmIdVenue` / `venueUuid` (S175, retirés Session A) garderait ces
  // entrées dans son JSON sauvegardé → `EXPORT_COLUMN_LABELS[col]` retourne
  // `undefined` → en-tête CSV vide. La whitelist `DEFAULT_COLUMNS_ORDER` est
  // la source de vérité.
  const allColumns = DEFAULT_COLUMNS_ORDER;
  const allColumnsSet = new Set<string>(allColumns);
  const purgedOrder = normalizedValue.order.filter(col => allColumnsSet.has(col));
  const missingColumns = allColumns.filter(col => !purgedOrder.includes(col));
  const purgedVisible = normalizedValue.visible.filter(col => allColumnsSet.has(col));

  if (
    missingColumns.length > 0 ||
    purgedOrder.length !== normalizedValue.order.length ||
    purgedVisible.length !== normalizedValue.visible.length
  ) {
    normalizedValue = {
      order: [...purgedOrder, ...missingColumns],
      visible: purgedVisible,
    };
  }

  // Colonnes visibles dans l'ordre
  const visibleColumnsOrdered = normalizedValue.order.filter(
    col => normalizedValue.visible.includes(col)
  );

  return {
    /** Preferences completes (ordre + visibilite) */
    preference: normalizedValue,
    /** Colonnes visibles uniquement, dans l'ordre */
    visibleColumns: visibleColumnsOrdered,
    /** Toutes les colonnes dans l'ordre */
    orderedColumns: normalizedValue.order,
    /** Chargement en cours */
    isLoading,
    /** Erreur eventuelle */
    error,
    /** Mettre a jour les preferences */
    setPreference,
    /** Rafraichir depuis Supabase */
    refresh,
  };
}

/**
 * Hook specialise pour les colonnes du tableau professionnels
 */
export function useProfessionalsColumnsPreference() {
  const {
    value,
    isLoading,
    setValue: setPreference,
  } = useUserPreference<ProfessionalColumn[]>(
    'admin_professionals_columns',
    DEFAULT_PROFESSIONAL_VISIBLE_COLUMNS
  );

  // Garantit que les nouvelles colonnes ajoutees sont incluses
  const visible = Array.isArray(value) ? value : DEFAULT_PROFESSIONAL_VISIBLE_COLUMNS;

  return {
    /** Colonnes visibles (preferences sauvegardees) */
    visibleColumns: visible,
    /** Chargement en cours */
    isLoading,
    /** Sauvegarder les colonnes visibles */
    setVisibleColumns: setPreference,
  };
}

/**
 * Hook specialise pour les colonnes de reservations compagnie (ordre + visibilite)
 */
export function useCompanyReservationColumnsPreference() {
  const {
    value,
    isLoading,
    error,
    setValue: setPreference,
    refresh,
  } = useUserPreference<CompanyReservationColumnsPreference>(
    'company_reservations_columns',
    DEFAULT_COMPANY_COLUMNS_PREFERENCE
  );

  // Assurer la compatibilite avec l'ancien format (tableau simple)
  let normalizedValue: CompanyReservationColumnsPreference = Array.isArray(value)
    ? { order: DEFAULT_COMPANY_COLUMNS_ORDER, visible: value }
    : value;

  // Sessions A+B — purge + ajout (cf. version admin ci-dessus).
  // `crmIdVenue` côté compagnie aurait pu être présent en prefs sauvegardées
  // depuis S175 ; on le retire ici.
  const allColumns = DEFAULT_COMPANY_COLUMNS_ORDER;
  const allColumnsSet = new Set<string>(allColumns);
  const purgedOrder = normalizedValue.order.filter(col => allColumnsSet.has(col));
  const missingColumns = allColumns.filter(col => !purgedOrder.includes(col));
  const purgedVisible = normalizedValue.visible.filter(col => allColumnsSet.has(col));

  if (
    missingColumns.length > 0 ||
    purgedOrder.length !== normalizedValue.order.length ||
    purgedVisible.length !== normalizedValue.visible.length
  ) {
    normalizedValue = {
      order: [...purgedOrder, ...missingColumns],
      visible: purgedVisible,
    };
  }

  // Colonnes visibles dans l'ordre
  const visibleColumnsOrdered = normalizedValue.order.filter(
    col => normalizedValue.visible.includes(col)
  );

  return {
    /** Preferences completes (ordre + visibilite) */
    preference: normalizedValue,
    /** Colonnes visibles uniquement, dans l'ordre */
    visibleColumns: visibleColumnsOrdered,
    /** Toutes les colonnes dans l'ordre */
    orderedColumns: normalizedValue.order,
    /** Chargement en cours */
    isLoading,
    /** Erreur eventuelle */
    error,
    /** Mettre a jour les preferences */
    setPreference,
    /** Rafraichir depuis Supabase */
    refresh,
  };
}
