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
