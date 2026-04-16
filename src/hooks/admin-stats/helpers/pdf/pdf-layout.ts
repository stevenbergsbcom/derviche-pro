/**
 * Layout PDF - Constantes partagées (marges, couleurs, polices)
 * @module hooks/admin-stats/helpers/pdf/pdf-layout
 *
 * Toutes les dimensions sont exprimées en millimètres (unité par défaut
 * de jsPDF dans les autres modules via `unit: 'mm'`).
 */

/** Dimensions d'une page A4 et marges standardisées. */
export const PDF_PAGE = {
  width: 210,
  height: 297,
  marginX: 15,
  marginTop: 20,
  marginBottom: 15,
} as const;

/** Y-coordonnée maximale avant de devoir ajouter une nouvelle page. */
export const PDF_MAX_Y = PDF_PAGE.height - PDF_PAGE.marginBottom;

/** Largeur utile d'une page (en mm), hors marges latérales. */
export const PDF_CONTENT_WIDTH = PDF_PAGE.width - PDF_PAGE.marginX * 2;

/** Couleurs de la charte Derviche (format hex, convertibles en RGB). */
export const PDF_COLORS = {
  text: '#0f172a',
  muted: '#64748b',
  accent: '#1e3a5f',
  success: '#059669',
  danger: '#dc2626',
  border: '#e2e8f0',
  bg: '#f1f5f9',
} as const;

/** Tuples RGB exploités par jsPDF (doc.setFillColor(r,g,b)). */
export const PDF_COLORS_RGB = {
  accent: [30, 58, 95] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  success: [5, 150, 105] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  bg: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
} as const;

/** Tailles et styles de police réutilisables. */
export const PDF_FONTS = {
  title: { size: 20, style: 'bold' as const },
  h2: { size: 14, style: 'bold' as const },
  h3: { size: 11, style: 'bold' as const },
  body: { size: 10, style: 'normal' as const },
  small: { size: 9, style: 'normal' as const },
  kpiValue: { size: 18, style: 'bold' as const },
  kpiLabel: { size: 9, style: 'normal' as const },
} as const;

/** Helper identité pour lisibilité (les valeurs sont déjà en mm). */
export function mm(n: number): number {
  return n;
}

/** Formate une date YYYY-MM-DD en format FR (16 avril 2026). */
export function formatDateFR(iso: string): string {
  // On parse manuellement (évite les décalages de fuseau horaire des Date()).
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Formate la date + heure de génération courante. */
export function formatGeneratedAt(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);
}
