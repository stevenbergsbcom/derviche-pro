/**
 * Service Homepage Settings — Fetch côté serveur
 * Derviche Diffusion
 *
 * Utilise createAdminClient() pour bypasser les RLS (la homepage est publique).
 * Ce fichier ne doit être importé que depuis des Server Components.
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  HOMEPAGE_SETTING_KEYS,
  HOMEPAGE_DEFAULTS,
  ORGANIZATION_SETTING_KEYS,
  type HomepageSettings,
  type HomepageHero,
  type HomepageAvantages,
  type HomepageSpectacles,
  type HomepageImpact,
  type HomepageContact,
  type HomepageFooter,
  type OrganizationSettings,
} from '@/lib/services/app-settings';

// ============================================
// TYPES
// ============================================

/** Données complètes pour la page d'accueil */
export interface HomepageData {
  homepage: HomepageSettings;
  organization: OrganizationSettings;
}

// ============================================
// FETCH
// ============================================

/**
 * Récupère toutes les données nécessaires au rendu de la page d'accueil.
 * - Paramètres homepage (hero, avantages, spectacles, impact, contact, footer)
 * - Paramètres organisation (email, téléphone, adresse pour contact/footer)
 *
 * Applique les defaults si des clés sont manquantes en base.
 */
export async function getHomepageData(): Promise<HomepageData> {
  const supabase = createAdminClient();
  const allKeys = [...HOMEPAGE_SETTING_KEYS, ...ORGANIZATION_SETTING_KEYS];

  const { data } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', allKeys);

  // Transformer en map clé → valeur
  const settings: Record<string, unknown> = {};
  (data || []).forEach((row: { key: string; value: unknown }) => {
    settings[row.key] = row.value;
  });

  return {
    homepage: {
      homepage_hero:
        (settings.homepage_hero as HomepageHero) ?? HOMEPAGE_DEFAULTS.homepage_hero,
      homepage_avantages:
        (settings.homepage_avantages as HomepageAvantages) ??
        HOMEPAGE_DEFAULTS.homepage_avantages,
      homepage_spectacles:
        (settings.homepage_spectacles as HomepageSpectacles) ??
        HOMEPAGE_DEFAULTS.homepage_spectacles,
      homepage_impact: {
        ...HOMEPAGE_DEFAULTS.homepage_impact,
        ...((settings.homepage_impact as Partial<HomepageImpact>) ?? {}),
      },
      homepage_contact:
        (settings.homepage_contact as HomepageContact) ??
        HOMEPAGE_DEFAULTS.homepage_contact,
      homepage_footer:
        (settings.homepage_footer as HomepageFooter) ?? HOMEPAGE_DEFAULTS.homepage_footer,
    },
    organization: {
      organization_name: (settings.organization_name as string) || null,
      organization_contact_email: (settings.organization_contact_email as string) || null,
      organization_contact_phone: (settings.organization_contact_phone as string) || null,
      organization_address: (settings.organization_address as string) || null,
      organization_website: (settings.organization_website as string) || null,
    },
  };
}
