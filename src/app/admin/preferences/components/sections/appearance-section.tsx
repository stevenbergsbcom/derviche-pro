/**
 * Section Apparence - Paramètres de thème, couleurs et logos
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Palette, Check, ImageIcon } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { toast } from 'sonner';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SettingsCard } from '../shared';
import { LogoUploader } from './logo-uploader';

import { useThemeSettings } from '@/hooks/app-settings';
import type { ThemeSettings } from '@/lib/services/app-settings';
import {
  THEME_OPTIONS,
  getThemePreset,
  dispatchLogoChange,
  generateCustomTheme,
  applyThemeColors,
  isDarkModeActive,
  DEFAULT_CUSTOM_SEEDS,
  type CustomThemeSeeds,
} from '@/lib/theme';
import { uploadLogo, replaceLogo, deleteLogo } from '@/lib/services/storage/logoStorage';
import { cn } from '@/lib/utils';

// ============================================
// PROPS
// ============================================

interface AppearanceSectionProps {
  /** Utilisateur peut modifier (super-admin) */
  canEdit: boolean;
  /** Callback pour notifier le parent des changements non sauvegardés */
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// COMPONENT
// ============================================

export function AppearanceSection({ canEdit, onDirtyChange }: AppearanceSectionProps) {
  const { data, isLoading, isSaving, error, update } = useThemeSettings();

  // Détection des changements
  const [hasChanges, setHasChanges] = useState(false);

  // Flag pour savoir si l'initialisation est faite
  const [isInitialized, setIsInitialized] = useState(false);

  // Ref pour la callback (évite les boucles infinies)
  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });

  // État local pour le thème
  const [selectedTheme, setSelectedTheme] = useState<string>('classic');

  // Ref pour stocker la valeur initiale du thème (pour comparaison)
  const initialThemeRef = useRef<string | null>(null);

  // État local pour les couleurs custom
  const [customSeeds, setCustomSeeds] = useState<CustomThemeSeeds>({ ...DEFAULT_CUSTOM_SEEDS });
  const initialCustomSeedsRef = useRef<CustomThemeSeeds | null>(null);

  // État local pour les logos (fichiers à uploader)
  const [logoWhiteFile, setLogoWhiteFile] = useState<File | null>(null);
  const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);

  // État pour marquer les logos supprimés
  const [logoWhiteDeleted, setLogoWhiteDeleted] = useState(false);
  const [logoDarkDeleted, setLogoDarkDeleted] = useState(false);

  // Erreurs d'upload
  const [logoWhiteError, setLogoWhiteError] = useState<string | null>(null);
  const [logoDarkError, setLogoDarkError] = useState<string | null>(null);

  // Ref pour les URLs originales des logos
  const originalLogoWhiteUrl = useRef<string | null>(null);
  const originalLogoDarkUrl = useRef<string | null>(null);

  // Initialiser quand les données arrivent (une seule fois)
  useEffect(() => {
    if (data && !isInitialized) {
      setSelectedTheme(data.theme_preset);
      initialThemeRef.current = data.theme_preset;
      originalLogoWhiteUrl.current = data.logo_white_url;
      originalLogoDarkUrl.current = data.logo_dark_url;

      // Charger les couleurs custom si elles existent
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
    // Ne rien faire tant que l'initialisation n'est pas terminée
    if (!isInitialized || initialThemeRef.current === null) return;

    const themeChanged = selectedTheme !== initialThemeRef.current;
    const logoWhiteChanged = logoWhiteFile !== null || logoWhiteDeleted;
    const logoDarkChanged = logoDarkFile !== null || logoDarkDeleted;

    // Vérifier si les couleurs custom ont changé
    const seedsChanged =
      selectedTheme === 'custom' &&
      initialCustomSeedsRef.current !== null &&
      (customSeeds.primary !== initialCustomSeedsRef.current.primary ||
        customSeeds.accent !== initialCustomSeedsRef.current.accent ||
        customSeeds.sidebar !== initialCustomSeedsRef.current.sidebar);

    const changed = themeChanged || logoWhiteChanged || logoDarkChanged || seedsChanged;

    setHasChanges(changed);
    onDirtyChangeRef.current?.(changed);
  }, [isInitialized, selectedTheme, logoWhiteFile, logoDarkFile, logoWhiteDeleted, logoDarkDeleted, customSeeds]);

  // Changement de thème
  const handleThemeChange = (themeId: string) => {
    if (!canEdit) return;
    setSelectedTheme(themeId);
  };

  // Mise à jour live d'une couleur custom (preview en temps réel)
  const handleCustomColorChange = useCallback(
    (key: keyof CustomThemeSeeds, color: string) => {
      const newSeeds = { ...customSeeds, [key]: color };
      setCustomSeeds(newSeeds);

      // Appliquer le thème en temps réel
      const palette = generateCustomTheme(newSeeds);
      const colors = isDarkModeActive() ? palette.dark : palette.light;
      applyThemeColors(colors, 'custom');
    },
    [customSeeds]
  );

  // Changement du logo blanc
  const handleLogoWhiteChange = (file: File | null) => {
    setLogoWhiteError(null);
    if (file) {
      setLogoWhiteFile(file);
      setLogoWhiteDeleted(false);
    } else {
      setLogoWhiteFile(null);
      // Si on avait déjà un logo, marquer comme supprimé
      if (data?.logo_white_url) {
        setLogoWhiteDeleted(true);
      }
    }
  };

  // Changement du logo sombre
  const handleLogoDarkChange = (file: File | null) => {
    setLogoDarkError(null);
    if (file) {
      setLogoDarkFile(file);
      setLogoDarkDeleted(false);
    } else {
      setLogoDarkFile(null);
      // Si on avait déjà un logo, marquer comme supprimé
      if (data?.logo_dark_url) {
        setLogoDarkDeleted(true);
      }
    }
  };

  // Soumission
  const onSubmit = async () => {
    const updates: Partial<ThemeSettings> = {};

    // 1. Mettre à jour le thème si changé
    if (selectedTheme !== initialThemeRef.current) {
      updates.theme_preset = selectedTheme;
    }

    // 1b. Sauvegarder les couleurs custom si le thème est "custom"
    if (selectedTheme === 'custom') {
      updates.custom_theme_colors = customSeeds;
      // Toujours inclure le preset pour s'assurer qu'il est bien sauvegardé
      updates.theme_preset = 'custom';
    }

    // 2. Gérer le logo blanc
    if (logoWhiteFile) {
      // Upload ou remplacement
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
      // Suppression
      await deleteLogo(data.logo_white_url);
      updates.logo_white_url = null;
    }

    // 3. Gérer le logo sombre
    if (logoDarkFile) {
      // Upload ou remplacement
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
      // Suppression
      await deleteLogo(data.logo_dark_url);
      updates.logo_dark_url = null;
    }

    // 4. Sauvegarder les changements
    if (Object.keys(updates).length > 0) {
      const result = await update(updates);

      if (result.success) {
        toast.success('Apparence enregistrée');
        // Mettre à jour les valeurs initiales
        if (updates.theme_preset) {
          initialThemeRef.current = updates.theme_preset;
        }
        if (updates.custom_theme_colors) {
          initialCustomSeedsRef.current = { ...customSeeds };
        }
        // Réinitialiser les états locaux
        setLogoWhiteFile(null);
        setLogoDarkFile(null);
        setLogoWhiteDeleted(false);
        setLogoDarkDeleted(false);
        setHasChanges(false);
        onDirtyChange?.(false);

        // Notifier les autres composants du changement de logo ou de thème
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

  // URL affichée pour le logo blanc (preview locale ou URL existante)
  const displayLogoWhiteUrl = logoWhiteDeleted ? null : data?.logo_white_url || null;
  const displayLogoDarkUrl = logoDarkDeleted ? null : data?.logo_dark_url || null;

  // Erreur de chargement
  if (error) {
    return (
      <SettingsCard
        icon={Palette}
        title="Apparence"
        description="Personnalisez les couleurs de la plateforme"
        canEdit={false}
      >
        <p className="text-sm text-destructive">Erreur : {error}</p>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      icon={Palette}
      title="Apparence"
      description="Personnalisez le thème et les logos de la plateforme"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={hasChanges}
      onSubmit={onSubmit}
    >
      <div className="space-y-6">
        {/* Section Thème */}
        <div className="space-y-4">
          <Label>Thème de couleurs</Label>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {THEME_OPTIONS.map((theme) => {
              const preset = getThemePreset(theme.value);
              const isSelected = selectedTheme === theme.value;
              const colors = preset.colors.light;

              return (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => handleThemeChange(theme.value)}
                  disabled={!canEdit}
                  aria-pressed={isSelected}
                  className={cn(
                    'group relative flex cursor-pointer flex-col gap-3 rounded-lg border-2 p-4 text-left',
                    'transition-all hover:shadow-md',
                    isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-muted',
                    !canEdit && 'cursor-not-allowed opacity-60'
                  )}
                >
                  {/* Prévisualisation du thème - Mini interface */}
                  <div
                    className="relative h-20 w-full overflow-hidden rounded-md border"
                    style={{ backgroundColor: colors.background }}
                  >
                    {/* Sidebar miniature */}
                    <div
                      className="absolute left-0 top-0 h-full w-6"
                      style={{ backgroundColor: colors.sidebarBackground }}
                    >
                      <div
                        className="mx-1 mt-2 h-2 w-4 rounded-sm"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <div
                        className="mx-1 mt-1 h-1.5 w-3 rounded-sm opacity-50"
                        style={{ backgroundColor: colors.sidebarForeground }}
                      />
                      <div
                        className="mx-1 mt-1 h-1.5 w-3 rounded-sm opacity-50"
                        style={{ backgroundColor: colors.sidebarForeground }}
                      />
                    </div>

                    {/* Contenu principal miniature */}
                    <div className="ml-8 p-2">
                      {/* Header */}
                      <div
                        className="mb-2 h-2 w-12 rounded-sm"
                        style={{ backgroundColor: colors.foreground }}
                      />
                      {/* Card */}
                      <div
                        className="rounded border p-1.5"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        }}
                      >
                        <div
                          className="mb-1 h-1.5 w-10 rounded-sm opacity-70"
                          style={{ backgroundColor: colors.cardForeground }}
                        />
                        <div className="flex gap-1">
                          <div
                            className="h-3 w-6 rounded-sm"
                            style={{ backgroundColor: colors.primary }}
                          />
                          <div
                            className="h-3 w-4 rounded-sm"
                            style={{ backgroundColor: colors.accent }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pastilles de couleurs */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: colors.background }}
                      title="Fond"
                    />
                    <div
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: colors.primary }}
                      title="Principal"
                    />
                    <div
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: colors.accent }}
                      title="Accent"
                    />
                    <div
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: colors.muted }}
                      title="Muted"
                    />
                  </div>

                  {/* Nom et description */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{theme.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </div>

                  {/* Badge sélectionné */}
                  {isSelected && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Le thème sera appliqué à l&apos;ensemble de la plateforme pour tous les utilisateurs.
          </p>

          {/* Color pickers pour le thème personnalisé */}
          {selectedTheme === 'custom' && (
            <div className="space-y-4 rounded-lg border border-dashed border-primary/30 bg-muted/30 p-4">
              <p className="text-sm font-medium">Personnaliser les couleurs</p>
              <div className="grid gap-6 sm:grid-cols-3">
                <ColorPickerField
                  label="Couleur principale"
                  description="Boutons, liens, accents"
                  value={customSeeds.primary}
                  onChange={(c) => handleCustomColorChange('primary', c)}
                  disabled={!canEdit}
                />
                <ColorPickerField
                  label="Couleur d'accent"
                  description="Accent secondaire, badges"
                  value={customSeeds.accent}
                  onChange={(c) => handleCustomColorChange('accent', c)}
                  disabled={!canEdit}
                />
                <ColorPickerField
                  label="Fond de la sidebar"
                  description="Barre latérale de navigation"
                  value={customSeeds.sidebar}
                  onChange={(c) => handleCustomColorChange('sidebar', c)}
                  disabled={!canEdit}
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Section Logos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <Label>Logos de l&apos;organisation</Label>
          </div>

          <p className="text-xs text-muted-foreground">
            Uploadez deux versions du logo : une version blanche pour les fonds sombres et une
            version sombre pour les fonds clairs. Le logo approprié sera automatiquement utilisé
            selon le thème choisi.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Logo blanc (pour fonds sombres) */}
            <LogoUploader
              value={displayLogoWhiteUrl}
              onChange={handleLogoWhiteChange}
              disabled={!canEdit || isSaving}
              error={logoWhiteError}
              label="Logo blanc (fonds sombres)"
              previewBgColor="dark"
              inputId="logo-white-upload"
            />

            {/* Logo sombre (pour fonds clairs) */}
            <LogoUploader
              value={displayLogoDarkUrl}
              onChange={handleLogoDarkChange}
              disabled={!canEdit || isSaving}
              error={logoDarkError}
              label="Logo sombre (fonds clairs)"
              previewBgColor="light"
              inputId="logo-dark-upload"
            />
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}

// ============================================
// COLOR PICKER FIELD
// ============================================

interface ColorPickerFieldProps {
  label: string;
  description: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

/** Valide un hex (avec ou sans #) */
function isValidHex(hex: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(hex);
}

function ColorPickerField({ label, description, value, onChange, disabled }: ColorPickerFieldProps) {
  const [inputValue, setInputValue] = useState(value);

  // Synchroniser quand la valeur externe change
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hex = e.target.value;
    setInputValue(hex);

    // Ajouter le # si absent
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (isValidHex(hex)) {
      onChange(hex);
    }
  };

  const handleInputBlur = () => {
    // Restaurer la dernière valeur valide si invalide
    if (!isValidHex(inputValue)) {
      setInputValue(value);
    }
  };

  return (
    <div className={cn('space-y-2', disabled && 'pointer-events-none opacity-60')}>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="[&_.react-colorful]:w-full [&_.react-colorful]:rounded-md">
        <HexColorPicker color={value} onChange={onChange} />
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 shrink-0 rounded border border-black/10"
          style={{ backgroundColor: value }}
        />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          maxLength={7}
          className="h-8 font-mono text-xs"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
