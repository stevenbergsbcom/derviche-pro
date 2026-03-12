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
  /** URL de base de l'application (ex: https://derviche-pro.fr) — dérivée de catalogueUrl */
  appUrl: string;
  signature: string;
  footerText: string;
  organizationName: string;
  /** Champs contact organisation — affichés dans le footer email */
  organizationContactEmail: string;
  organizationContactPhone: string;
  organizationAddress: string;
  organizationWebsite: string;
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
      'organization_contact_email',
      'organization_contact_phone',
      'organization_address',
      'organization_website',
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

    const catalogueUrl = settings['email_catalogue_url'] ?? 'https://derviche-pro.fr/catalogue';
    const appUrl = (() => { try { return new URL(catalogueUrl).origin; } catch { return 'https://derviche-pro.fr'; } })();

    return {
      fromName:                 settings['email_from_name']              ?? 'Derviche Diffusion',
      fromAddress:              settings['email_from_address']           ?? 'reservation@derviche-pro.fr',
      replyTo:                  settings['email_reply_to']              ?? 'reservation@derviche-pro.fr',
      catalogueUrl,
      appUrl,
      signature:                settings['email_signature']             ?? "L'équipe Derviche Diffusion",
      footerText:               settings['email_footer_text']           ?? 'Derviche Diffusion — reservation@derviche-pro.fr',
      organizationName:         settings['organization_name']           ?? 'Derviche Diffusion',
      organizationContactEmail: settings['organization_contact_email']  ?? '',
      organizationContactPhone: settings['organization_contact_phone']  ?? '',
      organizationAddress:      settings['organization_address']        ?? '',
      organizationWebsite:      settings['organization_website']        ?? '',
    };
  } catch (err) {
    logger.error('[email] Exception getEmailConfig', { err });
    return {
      fromName:                 'Derviche Diffusion',
      fromAddress:              'reservation@derviche-pro.fr',
      replyTo:                  'reservation@derviche-pro.fr',
      catalogueUrl:             'https://derviche-pro.fr/catalogue',
      appUrl:                   'https://derviche-pro.fr',
      signature:                "L'équipe Derviche Diffusion",
      footerText:               'Derviche Diffusion — reservation@derviche-pro.fr',
      organizationName:         'Derviche Diffusion',
      organizationContactEmail: '',
      organizationContactPhone: '',
      organizationAddress:      '',
      organizationWebsite:      '',
    };
  }
}
