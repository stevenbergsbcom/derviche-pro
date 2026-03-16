/**
 * Types partagés — Section Apparence
 * Derviche Diffusion
 */

import type { CustomThemeSeeds } from '@/lib/theme';

/** Props du sélecteur de thème. */
export interface ThemePickerProps {
  /** Thème actuellement sélectionné */
  selectedTheme: string;
  /** Callback lors du changement de thème */
  onThemeChange: (themeId: string) => void;
  /** Utilisateur peut modifier */
  canEdit: boolean;
}

/** Props du panneau de couleurs personnalisées. */
export interface CustomColorPickerProps {
  /** Couleurs seed actuelles */
  customSeeds: CustomThemeSeeds;
  /** Callback lors du changement d'une couleur */
  onColorChange: (key: keyof CustomThemeSeeds, color: string) => void;
  /** Utilisateur peut modifier */
  canEdit: boolean;
}

/** Props de la section logos. */
export interface LogoSectionProps {
  /** URL du logo blanc à afficher */
  displayLogoWhiteUrl: string | null;
  /** URL du logo sombre à afficher */
  displayLogoDarkUrl: string | null;
  /** Callback changement logo blanc */
  onLogoWhiteChange: (file: File | null) => void;
  /** Callback changement logo sombre */
  onLogoDarkChange: (file: File | null) => void;
  /** Utilisateur peut modifier */
  canEdit: boolean;
  /** Sauvegarde en cours */
  isSaving: boolean;
  /** Erreur upload logo blanc */
  logoWhiteError: string | null;
  /** Erreur upload logo sombre */
  logoDarkError: string | null;
}
