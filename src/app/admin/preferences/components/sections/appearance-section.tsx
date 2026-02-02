/**
 * Section Apparence - Paramètres de thème, couleurs et logos
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Palette, Check, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SettingsCard } from '../shared';
import { LogoUploader } from './logo-uploader';

import { useThemeSettings } from '@/hooks/useAppSettings';
import { THEME_OPTIONS, getThemePreset, dispatchLogoChange } from '@/lib/theme';
import { uploadLogo, replaceLogo, deleteLogo } from '@/lib/services/storage/logoStorage';
import { cn } from '@/lib/utils';

// ============================================
// PROPS
// ============================================

interface AppearanceSectionProps {
  /** Utilisateur peut modifier (super-admin) */
  canEdit: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function AppearanceSection({ canEdit }: AppearanceSectionProps) {
  const { data, isLoading, isSaving, error, update } = useThemeSettings();

  // État local pour le thème
  const [selectedTheme, setSelectedTheme] = useState<string>('classic');

  // État local pour les logos (fichiers à uploader)
  const [logoWhiteFile, setLogoWhiteFile] = useState<File | null>(null);
  const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);

  // État pour marquer les logos supprimés
  const [logoWhiteDeleted, setLogoWhiteDeleted] = useState(false);
  const [logoDarkDeleted, setLogoDarkDeleted] = useState(false);

  // Erreurs d'upload
  const [logoWhiteError, setLogoWhiteError] = useState<string | null>(null);
  const [logoDarkError, setLogoDarkError] = useState<string | null>(null);

  // Détection des changements
  const [hasChanges, setHasChanges] = useState(false);

  // Ref pour les URLs originales des logos
  const originalLogoWhiteUrl = useRef<string | null>(null);
  const originalLogoDarkUrl = useRef<string | null>(null);

  // Mettre à jour quand les données arrivent
  useEffect(() => {
    if (data) {
      setSelectedTheme(data.theme_preset);
      originalLogoWhiteUrl.current = data.logo_white_url;
      originalLogoDarkUrl.current = data.logo_dark_url;
    }
  }, [data]);

  // Détecter les changements
  useEffect(() => {
    if (data) {
      const themeChanged = selectedTheme !== data.theme_preset;
      const logoWhiteChanged = logoWhiteFile !== null || logoWhiteDeleted;
      const logoDarkChanged = logoDarkFile !== null || logoDarkDeleted;
      setHasChanges(themeChanged || logoWhiteChanged || logoDarkChanged);
    }
  }, [selectedTheme, data, logoWhiteFile, logoDarkFile, logoWhiteDeleted, logoDarkDeleted]);

  // Changement de thème
  const handleThemeChange = (themeId: string) => {
    if (!canEdit) return;
    setSelectedTheme(themeId);
  };

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
    const updates: {
      theme_preset?: string;
      logo_white_url?: string | null;
      logo_dark_url?: string | null;
    } = {};

    // 1. Mettre à jour le thème si changé
    if (selectedTheme !== data?.theme_preset) {
      updates.theme_preset = selectedTheme;
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
        // Réinitialiser les états locaux
        setLogoWhiteFile(null);
        setLogoDarkFile(null);
        setLogoWhiteDeleted(false);
        setLogoDarkDeleted(false);
        setHasChanges(false);

        // Notifier les autres composants du changement de logo ou de thème
        // (le changement de thème affecte aussi le choix du logo blanc/noir)
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
