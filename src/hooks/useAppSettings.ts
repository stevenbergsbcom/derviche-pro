/**
 * Hook useAppSettings - Gestion des paramètres globaux de l'application
 * Derviche Diffusion
 *
 * Hook React pour gérer les paramètres globaux (app_settings)
 * Utilisé dans la page admin/preferences
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getOrganizationSettings,
  setOrganizationSettings,
  getEmailSettings,
  getGoogleCalendarSettings,
  getNotificationSettings,
  getReminderSettings,
  getRgpdSettings,
  getThemeSettings,
  setThemeSettings,
  getSeasonSettings,
  setSeasonSettings,
  setAppSettings,
  type OrganizationSettings,
  type EmailSettings,
  type GoogleCalendarSettings,
  type NotificationSettings,
  type ReminderSettings,
  type RgpdSettings,
  type ThemeSettings,
  type SeasonSettings,
} from '@/lib/services/app-settings';
import { applyThemeAuto } from '@/lib/theme';

// ============================================
// TYPES
// ============================================

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

// ============================================
// HOOK ORGANISATION
// ============================================

/**
 * Hook pour gérer les paramètres d'organisation
 */
export function useOrganizationSettings(): UseAppSettingsReturn<OrganizationSettings> {
  const [data, setData] = useState<OrganizationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref pour éviter le problème de closure stale
  const dataRef = useRef<OrganizationSettings | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Charger les paramètres
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getOrganizationSettings();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Mettre à jour les paramètres
  const update = useCallback(
    async (
      newValue: Partial<OrganizationSettings>
    ): Promise<{ success: boolean; error?: string }> => {
      const previousValue = dataRef.current;

      // Mise à jour optimiste
      if (previousValue) {
        setData({ ...previousValue, ...newValue });
      }

      setIsSaving(true);
      const result = await setOrganizationSettings(newValue);
      setIsSaving(false);

      if (result.error) {
        // Rollback en cas d'erreur
        setData(previousValue);
        return { success: false, error: result.error };
      }

      // Mettre à jour avec les données retournées
      if (result.data) {
        setData(result.data);
      }

      return { success: true };
    },
    []
  );

  return {
    data,
    isLoading,
    isSaving,
    error,
    update,
    refresh: load,
  };
}

// ============================================
// HOOK SAISON
// ============================================

/**
 * Hook pour gérer les paramètres de saison du dashboard
 * Utilisé dans la section Organisation des préférences
 */
export function useSeasonSettings(): UseAppSettingsReturn<SeasonSettings> {
  const [data, setData] = useState<SeasonSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getSeasonSettings();

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setData(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const update = useCallback(
    async (newValue: Partial<SeasonSettings>): Promise<{ success: boolean; error?: string }> => {
      setIsSaving(true);

      const result = await setSeasonSettings(newValue);

      setIsSaving(false);

      if (result.error) {
        return { success: false, error: result.error };
      }

      if (result.data) {
        setData(result.data);
      }

      return { success: true };
    },
    []
  );

  return {
    data,
    isLoading,
    isSaving,
    error,
    update,
    refresh: load,
  };
}

// ============================================
// HOOK EMAIL
// ============================================

/**
 * Hook pour gérer les paramètres email
 */
export function useEmailSettings(): UseAppSettingsReturn<EmailSettings> {
  const [data, setData] = useState<EmailSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<EmailSettings | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getEmailSettings();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(
    async (newValue: Partial<EmailSettings>): Promise<{ success: boolean; error?: string }> => {
      const previousValue = dataRef.current;

      if (previousValue) {
        setData({ ...previousValue, ...newValue });
      }

      setIsSaving(true);
      const result = await setAppSettings(newValue);
      setIsSaving(false);

      if (result.error) {
        setData(previousValue);
        return { success: false, error: result.error };
      }

      return { success: true };
    },
    []
  );

  return {
    data,
    isLoading,
    isSaving,
    error,
    update,
    refresh: load,
  };
}

// ============================================
// HOOK RAPPELS
// ============================================

/**
 * Hook pour gérer les paramètres de rappels
 */
export function useReminderSettings(): UseAppSettingsReturn<ReminderSettings> {
  const [data, setData] = useState<ReminderSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<ReminderSettings | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getReminderSettings();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(
    async (newValue: Partial<ReminderSettings>): Promise<{ success: boolean; error?: string }> => {
      const previousValue = dataRef.current;

      if (previousValue) {
        setData({ ...previousValue, ...newValue });
      }

      setIsSaving(true);
      const result = await setAppSettings(newValue);
      setIsSaving(false);

      if (result.error) {
        setData(previousValue);
        return { success: false, error: result.error };
      }

      return { success: true };
    },
    []
  );

  return {
    data,
    isLoading,
    isSaving,
    error,
    update,
    refresh: load,
  };
}

// ============================================
// HOOK GOOGLE CALENDAR
// ============================================

/**
 * Hook pour gérer les paramètres Google Calendar
 * Config globale, modifiable par super-admin uniquement
 */
export function useGoogleCalendarSettings(): UseAppSettingsReturn<GoogleCalendarSettings> {
  const [data, setData] = useState<GoogleCalendarSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<GoogleCalendarSettings | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getGoogleCalendarSettings();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(
    async (newValue: Partial<GoogleCalendarSettings>): Promise<{ success: boolean; error?: string }> => {
      const previousValue = dataRef.current;

      if (previousValue) {
        setData({ ...previousValue, ...newValue });
      }

      setIsSaving(true);
      const result = await setAppSettings(newValue);
      setIsSaving(false);

      if (result.error) {
        if (previousValue !== null) {
          setData(previousValue);
        }
        return { success: false, error: result.error };
      }

      return { success: true };
    },
    []
  );

  return {
    data,
    isLoading,
    isSaving,
    error,
    update,
    refresh: load,
  };
}

// ============================================
// HOOK NOTIFICATIONS
// ============================================

/**
 * Hook pour gérer les paramètres de notifications email admin
 * Config globale, modifiable par super-admin uniquement
 */
export function useNotificationSettings(): UseAppSettingsReturn<NotificationSettings> {
  const [data, setData] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<NotificationSettings | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getNotificationSettings();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(
    async (newValue: Partial<NotificationSettings>): Promise<{ success: boolean; error?: string }> => {
      const previousValue = dataRef.current;

      if (previousValue) {
        setData({ ...previousValue, ...newValue });
      }

      setIsSaving(true);
      const result = await setAppSettings(newValue);
      setIsSaving(false);

      if (result.error) {
        // Rollback uniquement si on avait des données chargées
        if (previousValue !== null) {
          setData(previousValue);
        }
        return { success: false, error: result.error };
      }

      return { success: true };
    },
    []
  );

  return {
    data,
    isLoading,
    isSaving,
    error,
    update,
    refresh: load,
  };
}

// ============================================
// HOOK RGPD
// ============================================

/**
 * Hook pour gérer les paramètres RGPD
 */
export function useRgpdSettings(): UseAppSettingsReturn<RgpdSettings> {
  const [data, setData] = useState<RgpdSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<RgpdSettings | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getRgpdSettings();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(
    async (newValue: Partial<RgpdSettings>): Promise<{ success: boolean; error?: string }> => {
      const previousValue = dataRef.current;

      if (previousValue) {
        setData({ ...previousValue, ...newValue });
      }

      setIsSaving(true);
      const result = await setAppSettings(newValue);
      setIsSaving(false);

      if (result.error) {
        setData(previousValue);
        return { success: false, error: result.error };
      }

      return { success: true };
    },
    []
  );

  return {
    data,
    isLoading,
    isSaving,
    error,
    update,
    refresh: load,
  };
}

// ============================================
// HOOK THEME
// ============================================

/**
 * Hook pour gérer les paramètres de thème
 * Applique automatiquement le thème au chargement et à la mise à jour
 */
export function useThemeSettings(): UseAppSettingsReturn<ThemeSettings> {
  const [data, setData] = useState<ThemeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<ThemeSettings | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getThemeSettings();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
      // Appliquer le thème au chargement
      if (result.data?.theme_preset) {
        applyThemeAuto(result.data.theme_preset);
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(
    async (newValue: Partial<ThemeSettings>): Promise<{ success: boolean; error?: string }> => {
      const previousValue = dataRef.current;

      if (previousValue) {
        setData({ ...previousValue, ...newValue });
      }

      // Appliquer le thème immédiatement (optimiste)
      if (newValue.theme_preset) {
        applyThemeAuto(newValue.theme_preset);
      }

      setIsSaving(true);
      const result = await setThemeSettings(newValue);
      setIsSaving(false);

      if (result.error) {
        // Rollback en cas d'erreur
        setData(previousValue);
        if (previousValue?.theme_preset) {
          applyThemeAuto(previousValue.theme_preset);
        }
        return { success: false, error: result.error };
      }

      if (result.data) {
        setData(result.data);
      }

      return { success: true };
    },
    []
  );

  return {
    data,
    isLoading,
    isSaving,
    error,
    update,
    refresh: load,
  };
}
