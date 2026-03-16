/**
 * Paramètres RGPD
 * Derviche Diffusion
 */

import type { AppSettingResult, RgpdSettings } from './types';
import { RGPD_SETTING_KEYS } from './constants';
import { getAppSettings } from './core';

/**
 * Récupère les paramètres RGPD
 */
export async function getRgpdSettings(): Promise<AppSettingResult<RgpdSettings>> {
  const result = await getAppSettings(RGPD_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      rgpd_data_retention_months: (result.data?.rgpd_data_retention_months as number) ?? 36,
      rgpd_inactive_account_months: (result.data?.rgpd_inactive_account_months as number) ?? 24,
    },
    error: null,
  };
}
