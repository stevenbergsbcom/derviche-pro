/**
 * Paramètres d'organisation
 * Derviche Diffusion
 */

import type { AppSettingResult, OrganizationSettings } from './types';
import { ORGANIZATION_SETTING_KEYS } from './constants';
import { getAppSettings, setAppSettings } from './core';

/**
 * Récupère les paramètres d'organisation
 */
export async function getOrganizationSettings(): Promise<AppSettingResult<OrganizationSettings>> {
  const result = await getAppSettings(ORGANIZATION_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      organization_name: (result.data?.organization_name as string) || null,
      organization_contact_email: (result.data?.organization_contact_email as string) || null,
      organization_contact_phone: (result.data?.organization_contact_phone as string) || null,
      organization_address: (result.data?.organization_address as string) || null,
      organization_website: (result.data?.organization_website as string) || null,
    },
    error: null,
  };
}

/**
 * Met à jour les paramètres d'organisation
 * Note: Les null sont convertis en chaînes vides pour respecter la contrainte NOT NULL sur value
 */
export async function setOrganizationSettings(
  settings: Partial<OrganizationSettings>
): Promise<AppSettingResult<OrganizationSettings>> {
  // Convertir les null en chaînes vides (contrainte NOT NULL sur value)
  const sanitizedSettings: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    sanitizedSettings[key] = value ?? '';
  }

  const result = await setAppSettings(sanitizedSettings);

  if (result.error) {
    return { data: null, error: result.error };
  }

  // Récupérer les paramètres mis à jour
  return getOrganizationSettings();
}
