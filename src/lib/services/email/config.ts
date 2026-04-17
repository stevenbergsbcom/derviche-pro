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
  /** Toggles — quels champs organisation afficher dans le footer */
  footerShowEmail: boolean;
  footerShowPhone: boolean;
  footerShowAddress: boolean;
  footerShowWebsite: boolean;
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
      'email_footer_show_email',
      'email_footer_show_phone',
      'email_footer_show_address',
      'email_footer_show_website',
    ];

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', keys);

    if (error) {
      logger.error('[email] Erreur lecture app_settings', { error: error.message });
    }

    const settings: Record<string, string> = {};
    const boolSettings: Record<string, boolean> = {};
    (data ?? []).forEach((row: { key: string; value: unknown }) => {
      if (typeof row.value === 'string') settings[row.key] = row.value;
      if (typeof row.value === 'boolean') boolSettings[row.key] = row.value;
      if (row.value === 'true') boolSettings[row.key] = true;
      if (row.value === 'false') boolSettings[row.key] = false;
    });

    const catalogueUrl = settings['email_catalogue_url'] ?? 'https://derviche-pro.fr/catalogue';
    const appUrl = (() => { try { return new URL(catalogueUrl).origin; } catch { return 'https://derviche-pro.fr'; } })();

    return {
      fromName:                 settings['email_from_name']              ?? 'Derviche Diffusion',
      fromAddress:              settings['email_from_address']           ?? 'no-reply@derviche-pro.fr',
      replyTo:                  settings['email_reply_to']              ?? 'reservation.derviche@gmail.com',
      catalogueUrl,
      appUrl,
      signature:                settings['email_signature']             ?? "L'équipe Derviche Diffusion",
      footerText:               settings['email_footer_text']           ?? 'Derviche Diffusion',
      organizationName:         settings['organization_name']           ?? 'Derviche Diffusion',
      organizationContactEmail: settings['organization_contact_email']  ?? '',
      organizationContactPhone: settings['organization_contact_phone']  ?? '',
      organizationAddress:      settings['organization_address']        ?? '',
      organizationWebsite:      settings['organization_website']        ?? '',
      footerShowEmail:          boolSettings['email_footer_show_email']   ?? true,
      footerShowPhone:          boolSettings['email_footer_show_phone']   ?? true,
      footerShowAddress:        boolSettings['email_footer_show_address'] ?? true,
      footerShowWebsite:        boolSettings['email_footer_show_website'] ?? true,
    };
  } catch (err) {
    logger.error('[email] Exception getEmailConfig', { err });
    return {
      fromName:                 'Derviche Diffusion',
      fromAddress:              'no-reply@derviche-pro.fr',
      replyTo:                  'reservation.derviche@gmail.com',
      catalogueUrl:             'https://derviche-pro.fr/catalogue',
      appUrl:                   'https://derviche-pro.fr',
      signature:                "L'équipe Derviche Diffusion",
      footerText:               'Derviche Diffusion',
      organizationName:         'Derviche Diffusion',
      organizationContactEmail: '',
      organizationContactPhone: '',
      organizationAddress:      '',
      organizationWebsite:      '',
      footerShowEmail:          true,
      footerShowPhone:          true,
      footerShowAddress:        true,
      footerShowWebsite:        true,
    };
  }
}
