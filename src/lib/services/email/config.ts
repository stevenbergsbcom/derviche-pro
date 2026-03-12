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

    const catalogueUrl = settings['email_catalogue_url'] ?? 'https://derviche-pro.vercel.app/catalogue';
    const appUrl = (() => { try { return new URL(catalogueUrl).origin; } catch { return 'https://derviche-pro.vercel.app'; } })();

    return {
      fromName:                 settings['email_from_name']              ?? 'Derviche Diffusion',
      fromAddress:              settings['email_from_address']           ?? 'reservation.derviche@gmail.com',
      replyTo:                  settings['email_reply_to']              ?? 'reservation.derviche@gmail.com',
      catalogueUrl,
      appUrl,
      signature:                settings['email_signature']             ?? "L'équipe Derviche Diffusion",
      footerText:               settings['email_footer_text']           ?? 'Derviche Diffusion — reservation.derviche@gmail.com',
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
      fromAddress:              'reservation.derviche@gmail.com',
      replyTo:                  'reservation.derviche@gmail.com',
      catalogueUrl:             'https://derviche-pro.vercel.app/catalogue',
      appUrl:                   'https://derviche-pro.vercel.app',
      signature:                "L'équipe Derviche Diffusion",
      footerText:               'Derviche Diffusion — reservation.derviche@gmail.com',
      organizationName:         'Derviche Diffusion',
      organizationContactEmail: '',
      organizationContactPhone: '',
      organizationAddress:      '',
      organizationWebsite:      '',
    };
  }
}
