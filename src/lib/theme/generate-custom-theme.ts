/**
 * Generate Custom Theme - Génération de palette complète depuis 3 couleurs
 * Derviche Diffusion
 *
 * À partir de 3 couleurs seed (primary, accent, sidebar en hex),
 * génère les 46 variables ThemeColors en OKLCH pour light et dark mode.
 */

import type { ThemeColors } from './presets';
import { hexToOklch, oklchString, clamp } from './color-utils';

// ============================================
// TYPES
// ============================================

export interface CustomThemeSeeds {
  /** Couleur principale (boutons, liens, accents) - hex */
  primary: string;
  /** Couleur d'accent secondaire - hex */
  accent: string;
  /** Fond de la sidebar - hex */
  sidebar: string;
}

/** Seeds par défaut (bleu classique) */
export const DEFAULT_CUSTOM_SEEDS: CustomThemeSeeds = {
  primary: '#3b4f8a',
  accent: '#d4a84b',
  sidebar: '#f0ece4',
};

// ============================================
// HELPERS
// ============================================

/** Raccourci pour générer une chaîne oklch */
function o(l: number, c: number, h: number): string {
  return oklchString(clamp(l, 0, 1), clamp(c, 0, 0.4), h);
}

/**
 * Détermine si un fond est sombre (lightness < 0.5)
 */
function isDark(l: number): boolean {
  return l < 0.5;
}

/**
 * Choisit blanc ou noir pour le foreground selon la luminosité du fond
 */
function contrastFg(bgLightness: number): string {
  return isDark(bgLightness) ? 'oklch(0.98 0 0)' : 'oklch(0.15 0 0)';
}

// ============================================
// GENERATION
// ============================================

/**
 * Génère une palette ThemeColors complète pour le mode light
 */
function generateLightColors(
  primary: { l: number; c: number; h: number },
  accent: { l: number; c: number; h: number },
  sidebar: { l: number; c: number; h: number }
): ThemeColors {
  const pH = primary.h; // primary hue
  const aH = accent.h;  // accent hue
  const sH = sidebar.h; // sidebar hue

  const sidebarIsDark = isDark(sidebar.l);

  return {
    // Fond et texte principal (teinté légèrement avec le hue primary)
    background: o(0.98, 0.01, pH),
    foreground: o(0.2, 0.03, pH),

    // Cartes et popovers
    card: o(0.99, 0.008, pH),
    cardForeground: o(0.2, 0.03, pH),
    popover: o(0.99, 0.008, pH),
    popoverForeground: o(0.2, 0.03, pH),

    // Couleur principale (celle choisie par l'utilisateur)
    primary: o(primary.l, primary.c, pH),
    primaryForeground: contrastFg(primary.l),

    // Secondary (version très atténuée du primary)
    secondary: o(0.94, 0.02, pH),
    secondaryForeground: o(0.25, 0.04, pH),

    // Muted (tons atténués)
    muted: o(0.94, 0.02, pH),
    mutedForeground: o(0.5, 0.03, pH),

    // Accent (couleur choisie par l'utilisateur)
    accent: o(accent.l, accent.c, aH),
    accentForeground: contrastFg(accent.l),

    // Bordures et inputs
    border: o(0.89, 0.02, pH),
    input: o(0.89, 0.02, pH),
    ring: o(primary.l, primary.c, pH),

    // Sémantiques (fixes)
    success: 'oklch(0.65 0.2 145)',
    warning: 'oklch(0.75 0.18 85)',
    destructive: 'oklch(0.55 0.25 25)',
    destructiveForeground: 'oklch(0.98 0 0)',

    // Sidebar (dérivé de la couleur sidebar choisie)
    sidebarBackground: o(sidebar.l, sidebar.c, sH),
    sidebarForeground: sidebarIsDark
      ? o(0.95, 0.01, sH)
      : o(0.3, 0.04, sH),
    sidebarBorder: sidebarIsDark
      ? o(sidebar.l + 0.1, sidebar.c, sH)
      : o(sidebar.l - 0.08, sidebar.c + 0.01, sH),
    sidebarAccent: sidebarIsDark
      ? o(sidebar.l + 0.08, sidebar.c, sH)
      : o(sidebar.l - 0.04, sidebar.c + 0.01, sH),
    sidebarAccentForeground: sidebarIsDark
      ? o(0.95, 0.01, sH)
      : o(0.25, 0.04, sH),
    sidebarPrimary: sidebarIsDark
      ? o(0.98, 0, 0)
      : o(primary.l, primary.c, pH),
    sidebarPrimaryForeground: sidebarIsDark
      ? o(sidebar.l, sidebar.c, sH)
      : contrastFg(primary.l),

    // Marque Derviche (variantes du primary)
    derviche: o(primary.l, primary.c, pH),
    dervicheLight: o(clamp(primary.l + 0.1, 0, 1), primary.c * 0.85, pH),
    dervicheDark: o(clamp(primary.l - 0.1, 0, 1), primary.c * 1.1, pH),

    // Gold (variantes de l'accent)
    gold: o(accent.l, accent.c, aH),
    goldLight: o(clamp(accent.l + 0.1, 0, 1), accent.c * 0.85, aH),
  };
}

/**
 * Génère une palette ThemeColors complète pour le mode dark
 */
function generateDarkColors(
  primary: { l: number; c: number; h: number },
  accent: { l: number; c: number; h: number },
  sidebar: { l: number; c: number; h: number }
): ThemeColors {
  const pH = primary.h;
  const aH = accent.h;
  const sH = sidebar.h;

  // En dark mode, on augmente la luminosité du primary pour qu'il reste visible
  const darkPrimaryL = clamp(primary.l + 0.15, 0.45, 0.7);

  return {
    // Fond sombre
    background: o(0.15, 0.02, pH),
    foreground: o(0.92, 0.015, pH),

    card: o(0.18, 0.025, pH),
    cardForeground: o(0.92, 0.015, pH),
    popover: o(0.18, 0.025, pH),
    popoverForeground: o(0.92, 0.015, pH),

    // Primary éclairci pour contraste sur fond sombre
    primary: o(darkPrimaryL, primary.c, pH),
    primaryForeground: 'oklch(0.98 0 0)',

    secondary: o(0.23, 0.025, pH),
    secondaryForeground: o(0.88, 0.015, pH),

    muted: o(0.23, 0.025, pH),
    mutedForeground: o(0.6, 0.02, pH),

    accent: o(clamp(accent.l + 0.05, 0.5, 0.75), accent.c, aH),
    accentForeground: o(0.15, 0.025, aH),

    border: o(0.3, 0.025, pH),
    input: o(0.3, 0.025, pH),
    ring: o(darkPrimaryL, primary.c, pH),

    // Sémantiques (légèrement plus claires en dark)
    success: 'oklch(0.7 0.2 145)',
    warning: 'oklch(0.8 0.18 85)',
    destructive: 'oklch(0.55 0.25 25)',
    destructiveForeground: 'oklch(0.98 0 0)',

    // Sidebar dark mode
    sidebarBackground: o(0.12, 0.025, sH),
    sidebarForeground: o(0.82, 0.015, sH),
    sidebarBorder: o(0.25, 0.025, sH),
    sidebarAccent: o(0.2, 0.025, sH),
    sidebarAccentForeground: o(0.88, 0.015, sH),
    sidebarPrimary: o(darkPrimaryL, primary.c, pH),
    sidebarPrimaryForeground: 'oklch(0.98 0 0)',

    // Marque
    derviche: o(darkPrimaryL, primary.c, pH),
    dervicheLight: o(clamp(darkPrimaryL + 0.1, 0, 1), primary.c * 0.85, pH),
    dervicheDark: o(clamp(darkPrimaryL - 0.1, 0, 1), primary.c * 1.1, pH),

    gold: o(clamp(accent.l + 0.05, 0.5, 0.75), accent.c, aH),
    goldLight: o(clamp(accent.l + 0.15, 0.5, 0.85), accent.c * 0.85, aH),
  };
}

// ============================================
// EXPORT PRINCIPAL
// ============================================

/**
 * Génère un thème complet (light + dark) à partir de 3 couleurs hex
 */
export function generateCustomTheme(seeds: CustomThemeSeeds): {
  light: ThemeColors;
  dark: ThemeColors;
} {
  const primary = hexToOklch(seeds.primary);
  const accent = hexToOklch(seeds.accent);
  const sidebar = hexToOklch(seeds.sidebar);

  return {
    light: generateLightColors(primary, accent, sidebar),
    dark: generateDarkColors(primary, accent, sidebar),
  };
}
