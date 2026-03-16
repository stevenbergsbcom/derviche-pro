/**
 * Section Apparence - Orchestrateur thème, couleurs et logos
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { Palette } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import { SettingsCard } from '../../shared';

import { ThemePicker } from './theme-picker';
import { CustomColorPicker } from './custom-color-picker';
import { LogoSection } from './logo-section';
import { useAppearanceForm } from './useAppearanceForm';

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
  const {
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
    handleThemeChange,
    handleCustomColorChange,
    handleLogoWhiteChange,
    handleLogoDarkChange,
    onSubmit,
  } = useAppearanceForm({ canEdit, onDirtyChange });

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
        <ThemePicker
          selectedTheme={selectedTheme}
          onThemeChange={handleThemeChange}
          canEdit={canEdit}
        />

        {/* Couleurs personnalisées */}
        {selectedTheme === 'custom' && (
          <CustomColorPicker
            customSeeds={customSeeds}
            onColorChange={handleCustomColorChange}
            canEdit={canEdit}
          />
        )}

        <Separator />

        {/* Section Logos */}
        <LogoSection
          displayLogoWhiteUrl={displayLogoWhiteUrl}
          displayLogoDarkUrl={displayLogoDarkUrl}
          onLogoWhiteChange={handleLogoWhiteChange}
          onLogoDarkChange={handleLogoDarkChange}
          canEdit={canEdit}
          isSaving={isSaving}
          logoWhiteError={logoWhiteError}
          logoDarkError={logoDarkError}
        />
      </div>
    </SettingsCard>
  );
}
