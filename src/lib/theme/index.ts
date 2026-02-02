/**
 * Exports du module theme
 */

export {
  THEME_PRESETS,
  THEME_OPTIONS,
  DEFAULT_THEME,
  getThemePreset,
  isSidebarDark,
  type ThemeColors,
  type ThemePreset,
} from './presets';

export {
  applyTheme,
  applyThemeAuto,
  resetTheme,
  getCurrentTheme,
  isDarkModeActive,
  LOGO_CHANGE_EVENT,
  dispatchLogoChange,
  onLogoChange,
} from './apply-theme';
