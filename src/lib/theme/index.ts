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
  applyThemeColors,
  resetTheme,
  getCurrentTheme,
  isDarkModeActive,
  LOGO_CHANGE_EVENT,
  dispatchLogoChange,
  onLogoChange,
} from './apply-theme';

export {
  generateCustomTheme,
  DEFAULT_CUSTOM_SEEDS,
  type CustomThemeSeeds,
} from './generate-custom-theme';

export { hexToOklch, oklchToHex } from './color-utils';
