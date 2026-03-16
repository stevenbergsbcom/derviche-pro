/**
 * Hook de gestion du formulaire Apparence
 * Centralise l'état local, la détection de changements et la soumission
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

import { useThemeSettings } from '@/hooks/app-settings';
import type { ThemeSettings } from '@/lib/services/app-settings';
import {
  dispatchLogoChange,
  generateCustomTheme,
  applyThemeColors,
  isDarkModeActive,
  DEFAULT_CUSTOM_SEEDS,
  type CustomThemeSeeds,
} from '@/lib/theme';
import { uploadLogo, replaceLogo, deleteLogo } from '@/lib/services/storage/logoStorage';

// ============================================
// TYPES
// ============================================

interface UseAppearanceFormOptions {
  /** Utilisateur peut modifier */
  canEdit: boolean;
  /** Callback pour notifier le parent des changements non sauvegardés */
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// HOOK
// ============================================

/** Hook de gestion de l'état et de la soumission du formulaire Apparence. */
export function useAppearanceForm({ canEdit, onDirtyChange }: UseAppearanceFormOptions) {
  const { data, isLoading, isSaving, error, update } = useThemeSettings();

  // Détection des changements
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Ref pour la callback (évite les boucles infinies)
  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });

  // État local pour le thème
  const [selectedTheme, setSelectedTheme] = useState<string>('classic');
  const initialThemeRef = useRef<string | null>(null);

  // État local pour les couleurs custom
  const [customSeeds, setCustomSeeds] = useState<CustomThemeSeeds>({ ...DEFAULT_CUSTOM_SEEDS });
  const initialCustomSeedsRef = useRef<CustomThemeSeeds | null>(null);

  // État local pour les logos
  const [logoWhiteFile, setLogoWhiteFile] = useState<File | null>(null);
  const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);
  const [logoWhiteDeleted, setLogoWhiteDeleted] = useState(false);
  const [logoDarkDeleted, setLogoDarkDeleted] = useState(false);
  const [logoWhiteError, setLogoWhiteError] = useState<string | null>(null);
  const [logoDarkError, setLogoDarkError] = useState<string | null>(null);

  // Initialiser quand les données arrivent (une seule fois)
  useEffect(() => {
    if (data && !isInitialized) {
      setSelectedTheme(data.theme_preset);
      initialThemeRef.current = data.theme_preset;

      if (data.custom_theme_colors) {
        setCustomSeeds(data.custom_theme_colors);
        initialCustomSeedsRef.current = { ...data.custom_theme_colors };
      } else {
        initialCustomSeedsRef.current = { ...DEFAULT_CUSTOM_SEEDS };
      }

      setIsInitialized(true);
    }
  }, [data, isInitialized]);

  // Détecter les changements seulement après initialisation
  useEffect(() => {
    if (!isInitialized || initialThemeRef.current === null) return;

    const themeChanged = selectedTheme !== initialThemeRef.current;
    const logoWhiteChanged = logoWhiteFile !== null || logoWhiteDeleted;
    const logoDarkChanged = logoDarkFile !== null || logoDarkDeleted;
    const seedsChanged =
      selectedTheme === 'custom' &&
      initialCustomSeedsRef.current !== null &&
      (customSeeds.primary !== initialCustomSeedsRef.current.primary ||
        customSeeds.accent !== initialCustomSeedsRef.current.accent ||
        customSeeds.sidebar !== initialCustomSeedsRef.current.sidebar);

    const changed = themeChanged || logoWhiteChanged || logoDarkChanged || seedsChanged;
    setHasChanges(changed);
    onDirtyChangeRef.current?.(changed);
  }, [
    isInitialized,
    selectedTheme,
    logoWhiteFile,
    logoDarkFile,
    logoWhiteDeleted,
    logoDarkDeleted,
    customSeeds,
  ]);

  // --- Handlers ---

  const handleThemeChange = (themeId: string) => {
    if (!canEdit) return;
    setSelectedTheme(themeId);
  };

  const handleCustomColorChange = useCallback(
    (key: keyof CustomThemeSeeds, color: string) => {
      const newSeeds = { ...customSeeds, [key]: color };
      setCustomSeeds(newSeeds);

      const palette = generateCustomTheme(newSeeds);
      const colors = isDarkModeActive() ? palette.dark : palette.light;
      applyThemeColors(colors, 'custom');
    },
    [customSeeds]
  );

  const handleLogoWhiteChange = (file: File | null) => {
    setLogoWhiteError(null);
    if (file) {
      setLogoWhiteFile(file);
      setLogoWhiteDeleted(false);
    } else {
      setLogoWhiteFile(null);
      if (data?.logo_white_url) setLogoWhiteDeleted(true);
    }
  };

  const handleLogoDarkChange = (file: File | null) => {
    setLogoDarkError(null);
    if (file) {
      setLogoDarkFile(file);
      setLogoDarkDeleted(false);
    } else {
      setLogoDarkFile(null);
      if (data?.logo_dark_url) setLogoDarkDeleted(true);
    }
  };

  // --- Soumission ---

  const onSubmit = async () => {
    const updates: Partial<ThemeSettings> = {};

    if (selectedTheme !== initialThemeRef.current) {
      updates.theme_preset = selectedTheme;
    }
    if (selectedTheme === 'custom') {
      updates.custom_theme_colors = customSeeds;
      updates.theme_preset = 'custom';
    }

    // Logo blanc
    if (logoWhiteFile) {
      const result = data?.logo_white_url
        ? await replaceLogo(logoWhiteFile, 'white', data.logo_white_url)
        : await uploadLogo(logoWhiteFile, 'white');
      if (result.success && result.url) {
        updates.logo_white_url = result.url;
      } else {
        setLogoWhiteError(result.error || "Erreur lors de l'upload");
        toast.error('Erreur upload logo blanc');
        return;
      }
    } else if (logoWhiteDeleted && data?.logo_white_url) {
      await deleteLogo(data.logo_white_url);
      updates.logo_white_url = null;
    }

    // Logo sombre
    if (logoDarkFile) {
      const result = data?.logo_dark_url
        ? await replaceLogo(logoDarkFile, 'dark', data.logo_dark_url)
        : await uploadLogo(logoDarkFile, 'dark');
      if (result.success && result.url) {
        updates.logo_dark_url = result.url;
      } else {
        setLogoDarkError(result.error || "Erreur lors de l'upload");
        toast.error('Erreur upload logo sombre');
        return;
      }
    } else if (logoDarkDeleted && data?.logo_dark_url) {
      await deleteLogo(data.logo_dark_url);
      updates.logo_dark_url = null;
    }

    // Sauvegarder
    if (Object.keys(updates).length > 0) {
      const result = await update(updates);
      if (result.success) {
        toast.success('Apparence enregistrée');
        if (updates.theme_preset) initialThemeRef.current = updates.theme_preset;
        if (updates.custom_theme_colors) initialCustomSeedsRef.current = { ...customSeeds };
        setLogoWhiteFile(null);
        setLogoDarkFile(null);
        setLogoWhiteDeleted(false);
        setLogoDarkDeleted(false);
        setHasChanges(false);
        onDirtyChangeRef.current?.(false);

        if (
          updates.logo_white_url !== undefined ||
          updates.logo_dark_url !== undefined ||
          updates.theme_preset !== undefined
        ) {
          dispatchLogoChange();
        }
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde');
      }
    }
  };

  // --- Valeurs dérivées ---

  const displayLogoWhiteUrl = logoWhiteDeleted ? null : data?.logo_white_url || null;
  const displayLogoDarkUrl = logoDarkDeleted ? null : data?.logo_dark_url || null;

  return {
    // Données
    isLoading,
    isSaving,
    error,
    hasChanges,
    selectedTheme,
    customSeeds,
    displayLogoWhiteUrl,
    displayLogoDarkUrl,
    logoWhiteError,
    logoDarkError,
    // Handlers
    handleThemeChange,
    handleCustomColorChange,
    handleLogoWhiteChange,
    handleLogoDarkChange,
    onSubmit,
  };
}
