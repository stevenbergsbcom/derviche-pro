/**
 * Config Email — lecture depuis app_settings (DB)
 * Derviche Diffusion
 *
 * Ce module est côté serveur uniquement.
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// ============================================
// TYPE
// ============================================

export interface EmailConfig {
  fromName: string;
  fromAddress: string;
  replyTo: string;
  catalogueUrl: string;
  /** URL de base de l'application (ex: https://derviche-pro.vercel.app) — dérivée de catalogueUrl */
  appUrl: string;
  signature: string;
  footerText: string;
  organizationName: string;
}

// ============================================
// FONCTION
// ============================================

export async function getEmailConfig(): Promise<EmailConfig> {
  try {
    const supabase = await createClient();
    const keys = [
      'email_from_name',
      'email_from_address',
      'email_reply_to',
      'email_catalogue_url',
      'email_signature',
      'email_footer_text',
      'organization_name',
    ];

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', keys);

    if (error) {
      logger.error('[email] Erreur lecture app_settings', { error: error.message });
    }

    const settings: Record<string, string> = {};
    (data ?? []).forEach((row: { key: string; value: unknown }) => {
      if (typeof row.value === 'string') settings[row.key] = row.value;
    });

    const catalogueUrl = settings['email_catalogue_url'] ?? 'https://derviche-pro.vercel.app/catalogue';
    const appUrl = (() => { try { return new URL(catalogueUrl).origin; } catch { return 'https://derviche-pro.vercel.app'; } })();

    return {
      fromName:         settings['email_from_name']      ?? 'Derviche Diffusion',
      fromAddress:      settings['email_from_address']   ?? 'reservations@derviche-pro.fr',
      replyTo:          settings['email_reply_to']       ?? 'contact@derviche-pro.fr',
      // ⚠️ Mettre à jour la clé email_catalogue_url en DB vers derviche-pro.fr/catalogue
      catalogueUrl,
      appUrl,
      signature:        settings['email_signature']      ?? "L'équipe Derviche Diffusion",
      footerText:       settings['email_footer_text']    ?? 'Derviche Diffusion — contact@derviche-pro.fr',
      organizationName: settings['organization_name']    ?? 'Derviche Diffusion',
    };
  } catch (err) {
    logger.error('[email] Exception getEmailConfig', { err });
    return {
      fromName:         'Derviche Diffusion',
      fromAddress:      'reservations@derviche-pro.fr',
      replyTo:          'contact@derviche-pro.fr',
      catalogueUrl:     'https://derviche-pro.vercel.app/catalogue',
      appUrl:           'https://derviche-pro.vercel.app',
      signature:        "L'équipe Derviche Diffusion",
      footerText:       'Derviche Diffusion — contact@derviche-pro.fr',
      organizationName: 'Derviche Diffusion',
    };
  }
}
