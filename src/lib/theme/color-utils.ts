/**
 * Color Utils - Conversion hex ↔ OKLCH
 * Derviche Diffusion
 *
 * Utilitaires pour convertir entre couleurs hex (#rrggbb)
 * et OKLCH (format utilisé par les thèmes Tailwind CSS 4)
 */

import { oklch, formatHex, parse } from 'culori';

// ============================================
// TYPES
// ============================================

export interface OklchColor {
  l: number; // Lightness (0-1)
  c: number; // Chroma (0-0.4)
  h: number; // Hue (0-360)
}

// ============================================
// CONVERSION FUNCTIONS
// ============================================

/**
 * Convertit une couleur hex en OKLCH
 * @param hex - Couleur hex (ex: "#3b82f6")
 * @returns Composantes OKLCH { l, c, h }
 */
export function hexToOklch(hex: string): OklchColor {
  const color = oklch(parse(hex));

  if (!color) {
    // Fallback: gris neutre si la conversion échoue
    return { l: 0.5, c: 0, h: 0 };
  }

  return {
    l: round(color.l ?? 0.5, 4),
    c: round(color.c ?? 0, 4),
    h: round(color.h ?? 0, 1),
  };
}

/**
 * Convertit une couleur OKLCH en hex
 * @returns Couleur hex (ex: "#3b82f6")
 */
export function oklchToHex(l: number, c: number, h: number): string {
  const hex = formatHex({ mode: 'oklch', l, c, h });
  return hex ?? '#808080';
}

/**
 * Génère une chaîne CSS oklch()
 * @returns Format CSS (ex: "oklch(0.5 0.15 250)")
 */
export function oklchString(l: number, c: number, h: number): string {
  return `oklch(${round(l, 3)} ${round(c, 3)} ${round(h, 1)})`;
}

// ============================================
// HELPERS
// ============================================

/**
 * Arrondit un nombre à n décimales
 */
function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Clamp une valeur entre min et max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
