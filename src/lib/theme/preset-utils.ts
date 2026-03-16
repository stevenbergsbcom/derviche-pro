/**
 * Utilitaires pour les presets de thèmes
 * Derviche Diffusion
 */

import { THEME_PRESETS, DEFAULT_THEME, type ThemePreset } from './preset-data';

// ============================================
// HELPERS
// ============================================

/** Récupérer un thème par son ID */
export function getThemePreset(id: string): ThemePreset {
  return THEME_PRESETS[id] || THEME_PRESETS[DEFAULT_THEME];
}

/**
 * Détermine si la sidebar d'un thème a un fond sombre
 * Basé sur la luminosité OKLCH (premier paramètre < 0.5 = sombre)
 */
export function isSidebarDark(themeId: string, isDarkMode: boolean = false): boolean {
  const preset = getThemePreset(themeId);
  const colors = isDarkMode ? preset.colors.dark : preset.colors.light;
  const sidebarBg = colors.sidebarBackground;

  // Extraire la luminosité depuis oklch(L C H)
  const match = sidebarBg.match(/oklch\(([0-9.]+)/);
  if (match) {
    const lightness = parseFloat(match[1]);
    return lightness < 0.5;
  }

  // Par défaut, on considère la sidebar comme sombre
  return true;
}
