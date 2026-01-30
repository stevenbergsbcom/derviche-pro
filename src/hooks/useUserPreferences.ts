/**
 * Hook useUserPreferences - Gestion des préférences utilisateur
 * Derviche Diffusion
 * 
 * Hook React pour gérer les préférences utilisateur avec cache local
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getUserPreference,
  setUserPreference,
  type PreferenceKey,
} from '@/lib/services/user-preferences';

// ============================================
// TYPES
// ============================================

export interface UseUserPreferenceReturn<T> {
  /** Valeur de la préférence */
  value: T;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Mettre à jour la préférence */
  setValue: (newValue: T) => Promise<{ success: boolean; error?: string }>;
  /** Recharger depuis Supabase */
  refresh: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook pour gérer une préférence utilisateur spécifique
 * 
 * @param key - Clé de la préférence
 * @param defaultValue - Valeur par défaut si non définie
 */
export function useUserPreference<T>(
  key: PreferenceKey,
  defaultValue: T
): UseUserPreferenceReturn<T> {
  const [value, setValueState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref pour éviter le problème de closure stale dans setValue
  const valueRef = useRef<T>(defaultValue);
  
  // Garder la ref synchronisée avec la valeur
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Charger la préférence au montage
  const loadPreference = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getUserPreference<T>(key);

    if (result.error) {
      setError(result.error);
      // Garder la valeur par défaut en cas d'erreur
    } else if (result.data !== null) {
      setValueState(result.data);
    }
    // Si null sans erreur, garder defaultValue

    setIsLoading(false);
  }, [key]);

  useEffect(() => {
    void loadPreference();
  }, [loadPreference]);

  // Mettre à jour la préférence
  const setValue = useCallback(async (
    newValue: T
  ): Promise<{ success: boolean; error?: string }> => {
    // Capturer la valeur précédente depuis la ref (pas de stale closure)
    const previousValue = valueRef.current;
    
    // Mise à jour optimiste
    setValueState(newValue);

    const result = await setUserPreference<T>(key, newValue);

    if (result.error) {
      // Rollback en cas d'erreur
      setValueState(previousValue);
      return { success: false, error: result.error };
    }

    return { success: true };
  }, [key]);

  // Rafraîchir depuis Supabase
  const refresh = useCallback(async () => {
    await loadPreference();
  }, [loadPreference]);

  return {
    value,
    isLoading,
    error,
    setValue,
    refresh,
  };
}

// ============================================
// PRÉFÉRENCES ADMIN - COLONNES RÉSERVATIONS
// ============================================

/** Colonnes disponibles pour la liste des réservations admin */
export type ReservationColumn =
  | 'date'
  | 'spectacle'
  | 'venue'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'emailSecondary'
  | 'phoneSecondary'
  | 'organization'
  | 'function'
  | 'afcNumber'
  | 'address'
  | 'numPlaces'
  | 'status'
  | 'checkinStatus'
  | 'specialRequests'
  | 'checkinNotes'
  | 'checkinVenueNotes'
  | 'checkinInternalNotes'
  | 'createdAt';

/** Configuration des colonnes avec labels - Ordre logique */
export const RESERVATION_COLUMNS_CONFIG: Record<ReservationColumn, { label: string; defaultVisible: boolean }> = {
  // Infos réservation
  date: { label: 'Date', defaultVisible: true },
  spectacle: { label: 'Spectacle', defaultVisible: true },
  venue: { label: 'Lieu', defaultVisible: false },
  numPlaces: { label: 'Places', defaultVisible: true },
  status: { label: 'Statut', defaultVisible: true },
  checkinStatus: { label: 'Check-in', defaultVisible: true },
  
  // Infos personnelles
  lastName: { label: 'Nom', defaultVisible: true },
  firstName: { label: 'Prénom', defaultVisible: true },
  email: { label: 'Email', defaultVisible: true },
  phone: { label: 'Téléphone', defaultVisible: false },
  emailSecondary: { label: 'Email secondaire', defaultVisible: false },
  phoneSecondary: { label: 'Tél. secondaire', defaultVisible: false },
  
  // Infos professionnelles
  organization: { label: 'Structure', defaultVisible: false },
  function: { label: 'Fonction', defaultVisible: false },
  afcNumber: { label: 'N° AFC', defaultVisible: false },
  address: { label: 'Adresse', defaultVisible: false },
  
  // Notes et métadonnées
  specialRequests: { label: 'Demandes', defaultVisible: false },
  checkinNotes: { label: 'Notes check-in', defaultVisible: false },
  checkinVenueNotes: { label: 'Notes lieu', defaultVisible: false },
  checkinInternalNotes: { label: 'Notes internes', defaultVisible: false },
  createdAt: { label: 'Créé le', defaultVisible: false },
};

/** Ordre d'affichage par défaut des colonnes */
export const DEFAULT_COLUMNS_ORDER: ReservationColumn[] = [
  'date',
  'spectacle',
  'venue',
  'lastName',
  'firstName',
  'email',
  'phone',
  'emailSecondary',
  'phoneSecondary',
  'organization',
  'function',
  'afcNumber',
  'address',
  'numPlaces',
  'status',
  'checkinStatus',
  'specialRequests',
  'checkinNotes',
  'checkinVenueNotes',
  'checkinInternalNotes',
  'createdAt',
];

/** Colonnes visibles par défaut */
export const DEFAULT_VISIBLE_COLUMNS: ReservationColumn[] = Object.entries(RESERVATION_COLUMNS_CONFIG)
  .filter(([, config]) => config.defaultVisible)
  .map(([key]) => key as ReservationColumn);

/** Structure des préférences de colonnes */
export interface ReservationColumnsPreference {
  /** Ordre de toutes les colonnes */
  order: ReservationColumn[];
  /** Colonnes visibles */
  visible: ReservationColumn[];
}

/** Préférences par défaut */
export const DEFAULT_COLUMNS_PREFERENCE: ReservationColumnsPreference = {
  order: DEFAULT_COLUMNS_ORDER,
  visible: DEFAULT_VISIBLE_COLUMNS,
};

/**
 * Hook spécialisé pour les colonnes de réservations admin (ordre + visibilité)
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

  // Assurer la compatibilité avec l'ancien format (tableau simple)
  let normalizedValue: ReservationColumnsPreference = Array.isArray(value)
    ? { order: DEFAULT_COLUMNS_ORDER, visible: value }
    : value;

  // S'assurer que toutes les colonnes sont présentes dans l'ordre
  // (pour les nouvelles colonnes ajoutées après la sauvegarde des préférences)
  const allColumns = DEFAULT_COLUMNS_ORDER;
  const missingColumns = allColumns.filter(col => !normalizedValue.order.includes(col));
  
  if (missingColumns.length > 0) {
    normalizedValue = {
      ...normalizedValue,
      order: [...normalizedValue.order, ...missingColumns],
    };
  }

  // Colonnes visibles dans l'ordre
  const visibleColumnsOrdered = normalizedValue.order.filter(
    col => normalizedValue.visible.includes(col)
  );

  return {
    /** Préférences complètes (ordre + visibilité) */
    preference: normalizedValue,
    /** Colonnes visibles uniquement, dans l'ordre */
    visibleColumns: visibleColumnsOrdered,
    /** Toutes les colonnes dans l'ordre */
    orderedColumns: normalizedValue.order,
    /** Chargement en cours */
    isLoading,
    /** Erreur éventuelle */
    error,
    /** Mettre à jour les préférences */
    setPreference,
    /** Rafraîchir depuis Supabase */
    refresh,
  };
}

// ============================================
// PRÉFÉRENCES COMPAGNIE - COLONNES RÉSERVATIONS
// ============================================

/**
 * Colonnes disponibles pour la liste des réservations compagnie
 * EXCLUT: checkinInternalNotes (notes internes réservées à l'admin)
 */
export type CompanyReservationColumn =
  | 'date'
  | 'spectacle'
  | 'venue'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'emailSecondary'
  | 'phoneSecondary'
  | 'organization'
  | 'function'
  | 'afcNumber'
  | 'address'
  | 'numPlaces'
  | 'status'
  | 'checkinStatus'
  | 'specialRequests'
  | 'checkinNotes'
  | 'checkinVenueNotes'
  | 'createdAt';

/** Configuration des colonnes compagnie avec labels */
export const COMPANY_RESERVATION_COLUMNS_CONFIG: Record<CompanyReservationColumn, { label: string; defaultVisible: boolean }> = {
  // Infos réservation
  date: { label: 'Date', defaultVisible: true },
  spectacle: { label: 'Spectacle', defaultVisible: true },
  venue: { label: 'Lieu', defaultVisible: false },
  numPlaces: { label: 'Places', defaultVisible: true },
  status: { label: 'Statut', defaultVisible: true },
  checkinStatus: { label: 'Check-in', defaultVisible: true },
  
  // Infos personnelles
  lastName: { label: 'Nom', defaultVisible: true },
  firstName: { label: 'Prénom', defaultVisible: true },
  email: { label: 'Email', defaultVisible: true },
  phone: { label: 'Téléphone', defaultVisible: false },
  emailSecondary: { label: 'Email secondaire', defaultVisible: false },
  phoneSecondary: { label: 'Tél. secondaire', defaultVisible: false },
  
  // Infos professionnelles
  organization: { label: 'Structure', defaultVisible: false },
  function: { label: 'Fonction', defaultVisible: false },
  afcNumber: { label: 'N° AFC', defaultVisible: false },
  address: { label: 'Adresse', defaultVisible: false },
  
  // Notes et métadonnées (SANS notes internes)
  specialRequests: { label: 'Demandes', defaultVisible: false },
  checkinNotes: { label: 'Notes check-in', defaultVisible: false },
  checkinVenueNotes: { label: 'Notes lieu', defaultVisible: false },
  createdAt: { label: 'Créé le', defaultVisible: false },
};

/** Ordre d'affichage par défaut des colonnes compagnie */
export const DEFAULT_COMPANY_COLUMNS_ORDER: CompanyReservationColumn[] = [
  'date',
  'spectacle',
  'venue',
  'lastName',
  'firstName',
  'email',
  'phone',
  'emailSecondary',
  'phoneSecondary',
  'organization',
  'function',
  'afcNumber',
  'address',
  'numPlaces',
  'status',
  'checkinStatus',
  'specialRequests',
  'checkinNotes',
  'checkinVenueNotes',
  'createdAt',
];

/** Colonnes visibles par défaut compagnie */
export const DEFAULT_COMPANY_VISIBLE_COLUMNS: CompanyReservationColumn[] = Object.entries(COMPANY_RESERVATION_COLUMNS_CONFIG)
  .filter(([, config]) => config.defaultVisible)
  .map(([key]) => key as CompanyReservationColumn);

/** Structure des préférences de colonnes compagnie */
export interface CompanyReservationColumnsPreference {
  /** Ordre de toutes les colonnes */
  order: CompanyReservationColumn[];
  /** Colonnes visibles */
  visible: CompanyReservationColumn[];
}

/** Préférences par défaut compagnie */
export const DEFAULT_COMPANY_COLUMNS_PREFERENCE: CompanyReservationColumnsPreference = {
  order: DEFAULT_COMPANY_COLUMNS_ORDER,
  visible: DEFAULT_COMPANY_VISIBLE_COLUMNS,
};

/**
 * Hook spécialisé pour les colonnes de réservations compagnie (ordre + visibilité)
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

  // Assurer la compatibilité avec l'ancien format (tableau simple)
  let normalizedValue: CompanyReservationColumnsPreference = Array.isArray(value)
    ? { order: DEFAULT_COMPANY_COLUMNS_ORDER, visible: value }
    : value;

  // S'assurer que toutes les colonnes sont présentes dans l'ordre
  const allColumns = DEFAULT_COMPANY_COLUMNS_ORDER;
  const missingColumns = allColumns.filter(col => !normalizedValue.order.includes(col));
  
  if (missingColumns.length > 0) {
    normalizedValue = {
      ...normalizedValue,
      order: [...normalizedValue.order, ...missingColumns],
    };
  }

  // Colonnes visibles dans l'ordre
  const visibleColumnsOrdered = normalizedValue.order.filter(
    col => normalizedValue.visible.includes(col)
  );

  return {
    /** Préférences complètes (ordre + visibilité) */
    preference: normalizedValue,
    /** Colonnes visibles uniquement, dans l'ordre */
    visibleColumns: visibleColumnsOrdered,
    /** Toutes les colonnes dans l'ordre */
    orderedColumns: normalizedValue.order,
    /** Chargement en cours */
    isLoading,
    /** Erreur éventuelle */
    error,
    /** Mettre à jour les préférences */
    setPreference,
    /** Rafraîchir depuis Supabase */
    refresh,
  };
}
