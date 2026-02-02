/**
 * Apply Theme - Injection des variables CSS pour le thème actif
 * Derviche Diffusion
 *
 * Applique les couleurs d'un thème en modifiant les variables CSS
 * sur l'élément :root du document
 */

import { getThemePreset, DEFAULT_THEME, type ThemeColors } from './presets';

// ============================================
// MAPPING VARIABLES CSS
// ============================================

/**
 * Mapping entre les propriétés du thème et les variables CSS
 * Les variables correspondent à celles définies dans globals.css
 */
const CSS_VARIABLE_MAP: Record<keyof ThemeColors, string[]> = {
  // Fond et texte principal
  background: ['--background'],
  foreground: ['--foreground'],

  // Cartes et popovers
  card: ['--card'],
  cardForeground: ['--card-foreground'],
  popover: ['--popover'],
  popoverForeground: ['--popover-foreground'],

  // Primary
  primary: ['--primary'],
  primaryForeground: ['--primary-foreground'],

  // Secondary
  secondary: ['--secondary'],
  secondaryForeground: ['--secondary-foreground'],

  // Muted
  muted: ['--muted'],
  mutedForeground: ['--muted-foreground'],

  // Accent
  accent: ['--accent'],
  accentForeground: ['--accent-foreground'],

  // Bordures et inputs
  border: ['--border'],
  input: ['--input'],
  ring: ['--ring'],

  // Sémantiques
  success: ['--success'],
  warning: ['--warning'],
  destructive: ['--destructive'],
  destructiveForeground: ['--destructive-foreground'],

  // Sidebar
  sidebarBackground: ['--sidebar-background', '--sidebar'],
  sidebarForeground: ['--sidebar-foreground'],
  sidebarBorder: ['--sidebar-border'],
  sidebarAccent: ['--sidebar-accent'],
  sidebarAccentForeground: ['--sidebar-accent-foreground'],
  sidebarPrimary: ['--sidebar-primary'],
  sidebarPrimaryForeground: ['--sidebar-primary-foreground'],

  // Marque Derviche
  derviche: ['--derviche'],
  dervicheLight: ['--derviche-light'],
  dervicheDark: ['--derviche-dark'],

  // Gold
  gold: ['--gold'],
  goldLight: ['--gold-light'],
};

// ============================================
// FONCTIONS
// ============================================

/**
 * Applique les couleurs d'un thème au document
 * @param themeId - ID du thème à appliquer
 * @param isDarkMode - Si true, utilise les couleurs dark mode
 */
export function applyTheme(themeId: string, isDarkMode: boolean = false): void {
  if (typeof document === 'undefined') {
    // SSR - ne rien faire
    return;
  }

  const theme = getThemePreset(themeId);
  const colors = isDarkMode ? theme.colors.dark : theme.colors.light;
  const root = document.documentElement;

  // Appliquer chaque couleur
  Object.entries(colors).forEach(([key, value]) => {
    const cssVars = CSS_VARIABLE_MAP[key as keyof ThemeColors];
    if (cssVars && cssVars.length > 0) {
      cssVars.forEach((cssVar) => {
        root.style.setProperty(cssVar, value);
      });
    }
  });

  // Stocker l'ID du thème actif comme attribut data
  root.setAttribute('data-theme', themeId);
}

/**
 * Supprime les styles de thème personnalisés (retour aux valeurs CSS par défaut)
 */
export function resetTheme(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;

  // Supprimer toutes les variables personnalisées
  Object.values(CSS_VARIABLE_MAP)
    .flat()
    .forEach((cssVar) => {
      root.style.removeProperty(cssVar);
    });

  root.removeAttribute('data-theme');
}

/**
 * Récupère l'ID du thème actuellement appliqué
 */
export function getCurrentTheme(): string {
  if (typeof document === 'undefined') {
    return DEFAULT_THEME;
  }

  return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
}

/**
 * Vérifie si le mode sombre est actif
 */
export function isDarkModeActive(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.documentElement.classList.contains('dark');
}

/**
 * Applique le thème avec détection automatique du mode sombre
 */
export function applyThemeAuto(themeId: string): void {
  applyTheme(themeId, isDarkModeActive());
}

// ============================================
// ÉVÉNEMENTS LOGO
// ============================================

/** Nom de l'événement personnalisé pour le changement de logo */
export const LOGO_CHANGE_EVENT = 'derviche:logo-change';

/**
 * Déclenche un événement de changement de logo
 * À appeler après la mise à jour des logos dans les préférences
 */
export function dispatchLogoChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LOGO_CHANGE_EVENT));
}

/**
 * Écoute les changements de logo
 * @param callback - Fonction appelée lors d'un changement
 * @returns Fonction pour se désabonner
 */
export function onLogoChange(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(LOGO_CHANGE_EVENT, callback);
  return () => window.removeEventListener(LOGO_CHANGE_EVENT, callback);
}
