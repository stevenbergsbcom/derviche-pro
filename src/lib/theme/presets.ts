/**
 * Presets de thèmes - Définition des palettes de couleurs complètes
 * Derviche Diffusion
 *
 * Format OKLCH pour compatibilité avec Tailwind CSS 4
 * Chaque thème définit toutes les couleurs : fond, texte, cartes, etc.
 */

// ============================================
// TYPES
// ============================================

export interface ThemeColors {
  // Fond et texte principal
  background: string;
  foreground: string;

  // Cartes et popovers
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;

  // Couleurs principales
  primary: string;
  primaryForeground: string;

  // Secondaire
  secondary: string;
  secondaryForeground: string;

  // Muted (tons atténués)
  muted: string;
  mutedForeground: string;

  // Accent
  accent: string;
  accentForeground: string;

  // Bordures et inputs
  border: string;
  input: string;
  ring: string;

  // Couleurs sémantiques
  success: string;
  warning: string;
  destructive: string;
  destructiveForeground: string;

  // Sidebar
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarBorder: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;

  // Marque (alias)
  derviche: string;
  dervicheLight: string;
  dervicheDark: string;
  gold: string;
  goldLight: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

// ============================================
// PRESETS
// ============================================

export const THEME_PRESETS: Record<string, ThemePreset> = {
  classic: {
    id: 'classic',
    name: 'Classique',
    description: 'Élégant et professionnel, le thème original',
    colors: {
      light: {
        // Fond blanc pur
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.15 0.02 250)',

        card: 'oklch(1 0 0)',
        cardForeground: 'oklch(0.15 0.02 250)',
        popover: 'oklch(1 0 0)',
        popoverForeground: 'oklch(0.15 0.02 250)',

        // Bleu Derviche bordeaux/rouge sombre
        primary: 'oklch(0.3 0.08 250)',
        primaryForeground: 'oklch(0.98 0 0)',

        secondary: 'oklch(0.96 0.01 250)',
        secondaryForeground: 'oklch(0.25 0.03 250)',

        muted: 'oklch(0.96 0.01 250)',
        mutedForeground: 'oklch(0.55 0.02 250)',

        accent: 'oklch(0.75 0.15 85)',
        accentForeground: 'oklch(0.2 0.05 250)',

        border: 'oklch(0.9 0.01 250)',
        input: 'oklch(0.9 0.01 250)',
        ring: 'oklch(0.3 0.08 250)',

        success: 'oklch(0.65 0.2 145)',
        warning: 'oklch(0.75 0.18 85)',
        destructive: 'oklch(0.55 0.25 25)',
        destructiveForeground: 'oklch(0.98 0 0)',

        sidebarBackground: 'oklch(0.98 0.005 250)',
        sidebarForeground: 'oklch(0.35 0.03 250)',
        sidebarBorder: 'oklch(0.9 0.01 250)',
        sidebarAccent: 'oklch(0.95 0.01 250)',
        sidebarAccentForeground: 'oklch(0.25 0.03 250)',
        sidebarPrimary: 'oklch(0.3 0.08 250)',
        sidebarPrimaryForeground: 'oklch(0.98 0 0)',

        derviche: 'oklch(0.3 0.08 250)',
        dervicheLight: 'oklch(0.45 0.1 250)',
        dervicheDark: 'oklch(0.22 0.06 250)',
        gold: 'oklch(0.75 0.15 85)',
        goldLight: 'oklch(0.85 0.12 85)',
      },
      dark: {
        background: 'oklch(0.15 0.02 250)',
        foreground: 'oklch(0.95 0.01 250)',

        card: 'oklch(0.18 0.02 250)',
        cardForeground: 'oklch(0.95 0.01 250)',
        popover: 'oklch(0.18 0.02 250)',
        popoverForeground: 'oklch(0.95 0.01 250)',

        primary: 'oklch(0.5 0.15 250)',
        primaryForeground: 'oklch(0.98 0 0)',

        secondary: 'oklch(0.25 0.02 250)',
        secondaryForeground: 'oklch(0.9 0.01 250)',

        muted: 'oklch(0.25 0.02 250)',
        mutedForeground: 'oklch(0.65 0.02 250)',

        accent: 'oklch(0.7 0.15 85)',
        accentForeground: 'oklch(0.15 0.02 250)',

        border: 'oklch(0.3 0.02 250)',
        input: 'oklch(0.3 0.02 250)',
        ring: 'oklch(0.5 0.15 250)',

        success: 'oklch(0.7 0.2 145)',
        warning: 'oklch(0.8 0.18 85)',
        destructive: 'oklch(0.55 0.25 25)',
        destructiveForeground: 'oklch(0.98 0 0)',

        sidebarBackground: 'oklch(0.12 0.02 250)',
        sidebarForeground: 'oklch(0.85 0.02 250)',
        sidebarBorder: 'oklch(0.25 0.02 250)',
        sidebarAccent: 'oklch(0.2 0.02 250)',
        sidebarAccentForeground: 'oklch(0.9 0.01 250)',
        sidebarPrimary: 'oklch(0.5 0.15 250)',
        sidebarPrimaryForeground: 'oklch(0.98 0 0)',

        derviche: 'oklch(0.5 0.15 250)',
        dervicheLight: 'oklch(0.6 0.12 250)',
        dervicheDark: 'oklch(0.35 0.1 250)',
        gold: 'oklch(0.7 0.15 85)',
        goldLight: 'oklch(0.8 0.12 85)',
      },
    },
  },

  ocean: {
    id: 'ocean',
    name: 'Océan',
    description: 'Frais et apaisant avec des tons bleutés',
    colors: {
      light: {
        // Fond légèrement bleuté
        background: 'oklch(0.98 0.01 230)',
        foreground: 'oklch(0.18 0.05 230)',

        card: 'oklch(0.99 0.008 230)',
        cardForeground: 'oklch(0.18 0.05 230)',
        popover: 'oklch(0.99 0.008 230)',
        popoverForeground: 'oklch(0.18 0.05 230)',

        // Bleu océan profond
        primary: 'oklch(0.45 0.18 230)',
        primaryForeground: 'oklch(0.98 0 0)',

        secondary: 'oklch(0.94 0.02 230)',
        secondaryForeground: 'oklch(0.25 0.05 230)',

        muted: 'oklch(0.94 0.02 230)',
        mutedForeground: 'oklch(0.5 0.03 230)',

        // Turquoise
        accent: 'oklch(0.7 0.12 190)',
        accentForeground: 'oklch(0.2 0.08 230)',

        border: 'oklch(0.88 0.02 230)',
        input: 'oklch(0.88 0.02 230)',
        ring: 'oklch(0.45 0.18 230)',

        success: 'oklch(0.65 0.2 145)',
        warning: 'oklch(0.75 0.18 85)',
        destructive: 'oklch(0.55 0.25 25)',
        destructiveForeground: 'oklch(0.98 0 0)',

        sidebarBackground: 'oklch(0.96 0.015 230)',
        sidebarForeground: 'oklch(0.3 0.05 230)',
        sidebarBorder: 'oklch(0.88 0.02 230)',
        sidebarAccent: 'oklch(0.92 0.02 230)',
        sidebarAccentForeground: 'oklch(0.25 0.05 230)',
        sidebarPrimary: 'oklch(0.45 0.18 230)',
        sidebarPrimaryForeground: 'oklch(0.98 0 0)',

        derviche: 'oklch(0.45 0.18 230)',
        dervicheLight: 'oklch(0.55 0.15 230)',
        dervicheDark: 'oklch(0.35 0.2 230)',
        gold: 'oklch(0.7 0.12 190)',
        goldLight: 'oklch(0.8 0.1 190)',
      },
      dark: {
        background: 'oklch(0.15 0.03 230)',
        foreground: 'oklch(0.92 0.02 230)',

        card: 'oklch(0.18 0.03 230)',
        cardForeground: 'oklch(0.92 0.02 230)',
        popover: 'oklch(0.18 0.03 230)',
        popoverForeground: 'oklch(0.92 0.02 230)',

        primary: 'oklch(0.55 0.18 230)',
        primaryForeground: 'oklch(0.98 0 0)',

        secondary: 'oklch(0.25 0.03 230)',
        secondaryForeground: 'oklch(0.88 0.02 230)',

        muted: 'oklch(0.25 0.03 230)',
        mutedForeground: 'oklch(0.6 0.03 230)',

        accent: 'oklch(0.65 0.12 190)',
        accentForeground: 'oklch(0.15 0.03 230)',

        border: 'oklch(0.3 0.03 230)',
        input: 'oklch(0.3 0.03 230)',
        ring: 'oklch(0.55 0.18 230)',

        success: 'oklch(0.7 0.2 145)',
        warning: 'oklch(0.8 0.18 85)',
        destructive: 'oklch(0.55 0.25 25)',
        destructiveForeground: 'oklch(0.98 0 0)',

        sidebarBackground: 'oklch(0.12 0.03 230)',
        sidebarForeground: 'oklch(0.82 0.02 230)',
        sidebarBorder: 'oklch(0.25 0.03 230)',
        sidebarAccent: 'oklch(0.2 0.03 230)',
        sidebarAccentForeground: 'oklch(0.88 0.02 230)',
        sidebarPrimary: 'oklch(0.55 0.18 230)',
        sidebarPrimaryForeground: 'oklch(0.98 0 0)',

        derviche: 'oklch(0.55 0.18 230)',
        dervicheLight: 'oklch(0.65 0.15 230)',
        dervicheDark: 'oklch(0.45 0.2 230)',
        gold: 'oklch(0.65 0.12 190)',
        goldLight: 'oklch(0.75 0.1 190)',
      },
    },
  },

  night: {
    id: 'night',
    name: 'Nuit',
    description: 'Mode sombre élégant avec des accents violets',
    colors: {
      light: {
        // Fond gris anthracite clair
        background: 'oklch(0.95 0.01 280)',
        foreground: 'oklch(0.2 0.03 280)',

        card: 'oklch(0.97 0.008 280)',
        cardForeground: 'oklch(0.2 0.03 280)',
        popover: 'oklch(0.97 0.008 280)',
        popoverForeground: 'oklch(0.2 0.03 280)',

        // Indigo / Violet profond
        primary: 'oklch(0.4 0.18 280)',
        primaryForeground: 'oklch(0.98 0 0)',

        secondary: 'oklch(0.92 0.015 280)',
        secondaryForeground: 'oklch(0.25 0.04 280)',

        muted: 'oklch(0.92 0.015 280)',
        mutedForeground: 'oklch(0.5 0.03 280)',

        // Violet vif
        accent: 'oklch(0.6 0.2 300)',
        accentForeground: 'oklch(0.98 0 0)',

        border: 'oklch(0.88 0.015 280)',
        input: 'oklch(0.88 0.015 280)',
        ring: 'oklch(0.4 0.18 280)',

        success: 'oklch(0.65 0.2 145)',
        warning: 'oklch(0.75 0.18 85)',
        destructive: 'oklch(0.55 0.25 25)',
        destructiveForeground: 'oklch(0.98 0 0)',

        sidebarBackground: 'oklch(0.93 0.012 280)',
        sidebarForeground: 'oklch(0.3 0.04 280)',
        sidebarBorder: 'oklch(0.88 0.015 280)',
        sidebarAccent: 'oklch(0.9 0.02 280)',
        sidebarAccentForeground: 'oklch(0.25 0.04 280)',
        sidebarPrimary: 'oklch(0.4 0.18 280)',
        sidebarPrimaryForeground: 'oklch(0.98 0 0)',

        derviche: 'oklch(0.4 0.18 280)',
        dervicheLight: 'oklch(0.5 0.15 280)',
        dervicheDark: 'oklch(0.3 0.2 280)',
        gold: 'oklch(0.6 0.2 300)',
        goldLight: 'oklch(0.7 0.18 300)',
      },
      dark: {
        // Fond très sombre
        background: 'oklch(0.12 0.02 280)',
        foreground: 'oklch(0.92 0.015 280)',

        card: 'oklch(0.15 0.025 280)',
        cardForeground: 'oklch(0.92 0.015 280)',
        popover: 'oklch(0.15 0.025 280)',
        popoverForeground: 'oklch(0.92 0.015 280)',

        primary: 'oklch(0.55 0.2 280)',
        primaryForeground: 'oklch(0.98 0 0)',

        secondary: 'oklch(0.22 0.025 280)',
        secondaryForeground: 'oklch(0.88 0.015 280)',

        muted: 'oklch(0.22 0.025 280)',
        mutedForeground: 'oklch(0.6 0.02 280)',

        accent: 'oklch(0.65 0.2 300)',
        accentForeground: 'oklch(0.98 0 0)',

        border: 'oklch(0.28 0.025 280)',
        input: 'oklch(0.28 0.025 280)',
        ring: 'oklch(0.55 0.2 280)',

        success: 'oklch(0.7 0.2 145)',
        warning: 'oklch(0.8 0.18 85)',
        destructive: 'oklch(0.55 0.25 25)',
        destructiveForeground: 'oklch(0.98 0 0)',

        sidebarBackground: 'oklch(0.1 0.02 280)',
        sidebarForeground: 'oklch(0.82 0.015 280)',
        sidebarBorder: 'oklch(0.22 0.025 280)',
        sidebarAccent: 'oklch(0.18 0.025 280)',
        sidebarAccentForeground: 'oklch(0.88 0.015 280)',
        sidebarPrimary: 'oklch(0.55 0.2 280)',
        sidebarPrimaryForeground: 'oklch(0.98 0 0)',

        derviche: 'oklch(0.55 0.2 280)',
        dervicheLight: 'oklch(0.65 0.18 280)',
        dervicheDark: 'oklch(0.45 0.22 280)',
        gold: 'oklch(0.65 0.2 300)',
        goldLight: 'oklch(0.75 0.18 300)',
      },
    },
  },

  nature: {
    id: 'nature',
    name: 'Nature',
    description: 'Organique et chaleureux avec des tons beige et vert',
    colors: {
      light: {
        // Fond beige/crème léger
        background: 'oklch(0.97 0.015 90)',
        foreground: 'oklch(0.22 0.04 145)',

        card: 'oklch(0.98 0.012 90)',
        cardForeground: 'oklch(0.22 0.04 145)',
        popover: 'oklch(0.98 0.012 90)',
        popoverForeground: 'oklch(0.22 0.04 145)',

        // Vert forêt
        primary: 'oklch(0.4 0.12 145)',
        primaryForeground: 'oklch(0.98 0 0)',

        secondary: 'oklch(0.93 0.02 90)',
        secondaryForeground: 'oklch(0.28 0.04 145)',

        muted: 'oklch(0.93 0.02 90)',
        mutedForeground: 'oklch(0.5 0.03 145)',

        // Ocre / Terre
        accent: 'oklch(0.65 0.12 70)',
        accentForeground: 'oklch(0.22 0.04 145)',

        border: 'oklch(0.88 0.025 90)',
        input: 'oklch(0.88 0.025 90)',
        ring: 'oklch(0.4 0.12 145)',

        success: 'oklch(0.6 0.18 145)',
        warning: 'oklch(0.72 0.15 70)',
        destructive: 'oklch(0.55 0.22 25)',
        destructiveForeground: 'oklch(0.98 0 0)',

        sidebarBackground: 'oklch(0.95 0.018 90)',
        sidebarForeground: 'oklch(0.32 0.04 145)',
        sidebarBorder: 'oklch(0.88 0.025 90)',
        sidebarAccent: 'oklch(0.91 0.025 90)',
        sidebarAccentForeground: 'oklch(0.28 0.04 145)',
        sidebarPrimary: 'oklch(0.4 0.12 145)',
        sidebarPrimaryForeground: 'oklch(0.98 0 0)',

        derviche: 'oklch(0.4 0.12 145)',
        dervicheLight: 'oklch(0.5 0.1 145)',
        dervicheDark: 'oklch(0.3 0.14 145)',
        gold: 'oklch(0.65 0.12 70)',
        goldLight: 'oklch(0.75 0.1 70)',
      },
      dark: {
        background: 'oklch(0.16 0.025 145)',
        foreground: 'oklch(0.9 0.02 90)',

        card: 'oklch(0.19 0.025 145)',
        cardForeground: 'oklch(0.9 0.02 90)',
        popover: 'oklch(0.19 0.025 145)',
        popoverForeground: 'oklch(0.9 0.02 90)',

        primary: 'oklch(0.55 0.12 145)',
        primaryForeground: 'oklch(0.98 0 0)',

        secondary: 'oklch(0.25 0.025 145)',
        secondaryForeground: 'oklch(0.85 0.02 90)',

        muted: 'oklch(0.25 0.025 145)',
        mutedForeground: 'oklch(0.6 0.02 90)',

        accent: 'oklch(0.6 0.12 70)',
        accentForeground: 'oklch(0.16 0.025 145)',

        border: 'oklch(0.3 0.025 145)',
        input: 'oklch(0.3 0.025 145)',
        ring: 'oklch(0.55 0.12 145)',

        success: 'oklch(0.65 0.18 145)',
        warning: 'oklch(0.75 0.15 70)',
        destructive: 'oklch(0.55 0.22 25)',
        destructiveForeground: 'oklch(0.98 0 0)',

        sidebarBackground: 'oklch(0.13 0.025 145)',
        sidebarForeground: 'oklch(0.8 0.02 90)',
        sidebarBorder: 'oklch(0.25 0.025 145)',
        sidebarAccent: 'oklch(0.2 0.025 145)',
        sidebarAccentForeground: 'oklch(0.85 0.02 90)',
        sidebarPrimary: 'oklch(0.55 0.12 145)',
        sidebarPrimaryForeground: 'oklch(0.98 0 0)',

        derviche: 'oklch(0.55 0.12 145)',
        dervicheLight: 'oklch(0.65 0.1 145)',
        dervicheDark: 'oklch(0.45 0.14 145)',
        gold: 'oklch(0.6 0.12 70)',
        goldLight: 'oklch(0.7 0.1 70)',
      },
    },
  },

  theatre: {
    id: 'theatre',
    name: 'Théâtre',
    description: 'Le thème original avec sidebar bleu foncé et or',
    colors: {
      light: {
        // Fond blanc pur (valeurs originales globals.css)
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.145 0 0)',

        card: 'oklch(1 0 0)',
        cardForeground: 'oklch(0.145 0 0)',
        popover: 'oklch(1 0 0)',
        popoverForeground: 'oklch(0.145 0 0)',

        // Bleu Derviche original
        primary: 'oklch(0.3 0.08 250)',
        primaryForeground: 'oklch(0.985 0 0)',

        secondary: 'oklch(0.97 0 0)',
        secondaryForeground: 'oklch(0.205 0 0)',

        muted: 'oklch(0.97 0 0)',
        mutedForeground: 'oklch(0.556 0 0)',

        // Accent neutre (original)
        accent: 'oklch(0.97 0 0)',
        accentForeground: 'oklch(0.205 0 0)',

        border: 'oklch(0.922 0 0)',
        input: 'oklch(0.922 0 0)',
        ring: 'oklch(0.3 0.08 250)',

        success: 'oklch(0.65 0.2 145)',
        warning: 'oklch(0.75 0.18 85)',
        destructive: 'oklch(0.577 0.245 27.325)',
        destructiveForeground: 'oklch(0.985 0 0)',

        // Sidebar bleu foncé (caractéristique du thème original)
        sidebarBackground: 'oklch(0.22 0.06 250)',
        sidebarForeground: 'oklch(0.985 0 0)',
        sidebarBorder: 'oklch(0.35 0.08 250)',
        sidebarAccent: 'oklch(0.3 0.08 250)',
        sidebarAccentForeground: 'oklch(0.985 0 0)',
        sidebarPrimary: 'oklch(0.985 0 0)',
        sidebarPrimaryForeground: 'oklch(0.22 0.06 250)',

        derviche: 'oklch(0.3 0.08 250)',
        dervicheLight: 'oklch(0.45 0.1 250)',
        dervicheDark: 'oklch(0.22 0.06 250)',
        gold: 'oklch(0.75 0.15 85)',
        goldLight: 'oklch(0.85 0.12 85)',
      },
      dark: {
        background: 'oklch(0.145 0 0)',
        foreground: 'oklch(0.985 0 0)',

        card: 'oklch(0.205 0 0)',
        cardForeground: 'oklch(0.985 0 0)',
        popover: 'oklch(0.205 0 0)',
        popoverForeground: 'oklch(0.985 0 0)',

        primary: 'oklch(0.5 0.15 250)',
        primaryForeground: 'oklch(0.985 0 0)',

        secondary: 'oklch(0.269 0 0)',
        secondaryForeground: 'oklch(0.985 0 0)',

        muted: 'oklch(0.269 0 0)',
        mutedForeground: 'oklch(0.708 0 0)',

        accent: 'oklch(0.269 0 0)',
        accentForeground: 'oklch(0.985 0 0)',

        border: 'oklch(0.3 0 0)',
        input: 'oklch(0.3 0 0)',
        ring: 'oklch(0.5 0.15 250)',

        success: 'oklch(0.7 0.2 145)',
        warning: 'oklch(0.8 0.18 85)',
        destructive: 'oklch(0.704 0.191 22.216)',
        destructiveForeground: 'oklch(0.985 0 0)',

        sidebarBackground: 'oklch(0.18 0.05 250)',
        sidebarForeground: 'oklch(0.985 0 0)',
        sidebarBorder: 'oklch(0.25 0.05 250)',
        sidebarAccent: 'oklch(0.269 0 0)',
        sidebarAccentForeground: 'oklch(0.985 0 0)',
        sidebarPrimary: 'oklch(0.488 0.243 264.376)',
        sidebarPrimaryForeground: 'oklch(0.985 0 0)',

        derviche: 'oklch(0.5 0.15 250)',
        dervicheLight: 'oklch(0.6 0.15 250)',
        dervicheDark: 'oklch(0.35 0.1 250)',
        gold: 'oklch(0.8 0.15 85)',
        goldLight: 'oklch(0.9 0.1 85)',
      },
    },
  },

  // Le preset 'custom' est un placeholder : les vraies couleurs sont
  // générées dynamiquement via generateCustomTheme() et appliquées
  // via applyThemeColors(). Ces valeurs ne sont utilisées que comme
  // fallback si les seeds custom ne sont pas encore chargées.
  custom: {
    id: 'custom',
    name: 'Personnalisé',
    description: 'Créez votre palette sur mesure',
    colors: {
      light: {
        background: 'oklch(0.98 0.01 250)',
        foreground: 'oklch(0.2 0.03 250)',
        card: 'oklch(0.99 0.008 250)',
        cardForeground: 'oklch(0.2 0.03 250)',
        popover: 'oklch(0.99 0.008 250)',
        popoverForeground: 'oklch(0.2 0.03 250)',
        primary: 'oklch(0.3 0.08 250)',
        primaryForeground: 'oklch(0.98 0 0)',
        secondary: 'oklch(0.94 0.02 250)',
        secondaryForeground: 'oklch(0.25 0.04 250)',
        muted: 'oklch(0.94 0.02 250)',
        mutedForeground: 'oklch(0.5 0.03 250)',
        accent: 'oklch(0.75 0.15 85)',
        accentForeground: 'oklch(0.2 0.05 250)',
        border: 'oklch(0.89 0.02 250)',
        input: 'oklch(0.89 0.02 250)',
        ring: 'oklch(0.3 0.08 250)',
        success: 'oklch(0.65 0.2 145)',
        warning: 'oklch(0.75 0.18 85)',
        destructive: 'oklch(0.55 0.25 25)',
        destructiveForeground: 'oklch(0.98 0 0)',
        sidebarBackground: 'oklch(0.98 0.005 250)',
        sidebarForeground: 'oklch(0.35 0.03 250)',
        sidebarBorder: 'oklch(0.9 0.01 250)',
        sidebarAccent: 'oklch(0.95 0.01 250)',
        sidebarAccentForeground: 'oklch(0.25 0.03 250)',
        sidebarPrimary: 'oklch(0.3 0.08 250)',
        sidebarPrimaryForeground: 'oklch(0.98 0 0)',
        derviche: 'oklch(0.3 0.08 250)',
        dervicheLight: 'oklch(0.45 0.1 250)',
        dervicheDark: 'oklch(0.22 0.06 250)',
        gold: 'oklch(0.75 0.15 85)',
        goldLight: 'oklch(0.85 0.12 85)',
      },
      dark: {
        background: 'oklch(0.15 0.02 250)',
        foreground: 'oklch(0.95 0.01 250)',
        card: 'oklch(0.18 0.02 250)',
        cardForeground: 'oklch(0.95 0.01 250)',
        popover: 'oklch(0.18 0.02 250)',
        popoverForeground: 'oklch(0.95 0.01 250)',
        primary: 'oklch(0.5 0.15 250)',
        primaryForeground: 'oklch(0.98 0 0)',
        secondary: 'oklch(0.25 0.02 250)',
        secondaryForeground: 'oklch(0.9 0.01 250)',
        muted: 'oklch(0.25 0.02 250)',
        mutedForeground: 'oklch(0.65 0.02 250)',
        accent: 'oklch(0.7 0.15 85)',
        accentForeground: 'oklch(0.15 0.02 250)',
        border: 'oklch(0.3 0.02 250)',
        input: 'oklch(0.3 0.02 250)',
        ring: 'oklch(0.5 0.15 250)',
        success: 'oklch(0.7 0.2 145)',
        warning: 'oklch(0.8 0.18 85)',
        destructive: 'oklch(0.55 0.25 25)',
        destructiveForeground: 'oklch(0.98 0 0)',
        sidebarBackground: 'oklch(0.12 0.02 250)',
        sidebarForeground: 'oklch(0.85 0.02 250)',
        sidebarBorder: 'oklch(0.25 0.02 250)',
        sidebarAccent: 'oklch(0.2 0.02 250)',
        sidebarAccentForeground: 'oklch(0.9 0.01 250)',
        sidebarPrimary: 'oklch(0.5 0.15 250)',
        sidebarPrimaryForeground: 'oklch(0.98 0 0)',
        derviche: 'oklch(0.5 0.15 250)',
        dervicheLight: 'oklch(0.6 0.12 250)',
        dervicheDark: 'oklch(0.35 0.1 250)',
        gold: 'oklch(0.7 0.15 85)',
        goldLight: 'oklch(0.8 0.12 85)',
      },
    },
  },
};

// ============================================
// HELPERS
// ============================================

/** Liste des thèmes pour les selects */
export const THEME_OPTIONS = Object.values(THEME_PRESETS).map((preset) => ({
  value: preset.id,
  label: preset.name,
  description: preset.description,
}));

/** Thème par défaut */
export const DEFAULT_THEME = 'classic';

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
