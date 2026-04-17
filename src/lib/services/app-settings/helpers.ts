/**
 * Helpers partagés pour les modules app-settings
 */

/**
 * Convertit proprement les valeurs JSONB (boolean ou string 'true'/'false')
 */
export const parseBool = (val: unknown, fallback: boolean): boolean => {
  if (typeof val === 'boolean') return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return fallback;
};

/**
 * Parse une valeur JSONB/brute en string appartenant à une enum.
 * Strip les guillemets si présents (cas JSONB stringifié).
 */
export function parseStringEnum<T extends string>(
  val: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof val === 'string') {
    const cleaned = val.replace(/^"|"$/g, '') as T;
    if ((allowed as readonly string[]).includes(cleaned)) return cleaned;
  }
  return fallback;
}

/**
 * Parse une valeur JSONB/brute en nombre dans une plage optionnelle.
 *
 * - Si la valeur n'est pas un nombre valide, retourne `fallback`.
 * - Si la valeur est hors plage :
 *   - `clamp: true` (défaut) → ramène à la borne min/max correspondante,
 *     cohérent avec le clamp que les formulaires appliquent au submit.
 *   - `clamp: false` → retourne `fallback`.
 */
export function parseNumber(
  val: unknown,
  fallback: number,
  range?: { min?: number; max?: number; clamp?: boolean },
): number {
  const n =
    typeof val === 'number' ? val : typeof val === 'string' ? Number(val) : NaN;
  if (!Number.isFinite(n)) return fallback;
  const clamp = range?.clamp !== false;
  if (range?.min !== undefined && n < range.min) {
    return clamp ? range.min : fallback;
  }
  if (range?.max !== undefined && n > range.max) {
    return clamp ? range.max : fallback;
  }
  return n;
}

/**
 * Parse une valeur JSONB (array native ou JSON string) en string[] filtré.
 * Filtre automatiquement les éléments non-string.
 */
export function parseStringArray(val: unknown): string[] {
  const arr: unknown = Array.isArray(val)
    ? val
    : typeof val === 'string'
      ? (() => {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        })()
      : [];
  return Array.isArray(arr)
    ? arr.filter((x): x is string => typeof x === 'string')
    : [];
}
