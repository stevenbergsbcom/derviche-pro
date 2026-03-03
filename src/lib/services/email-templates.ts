/**
 * Service Email Templates - Lecture et mise à jour des templates email
 * Derviche Diffusion
 *
 * Lit les templates depuis la table `email_templates` et expose
 * une fonction de substitution des variables dans les textes.
 *
 * Permissions RLS :
 * - super-admin : lecture + écriture
 * - admin : lecture seule
 * - authentifié : lecture des templates actifs (pour les routes API email)
 *
 * Ce service doit être utilisé côté serveur uniquement (routes API).
 * Pour l'UI admin (S134B), utiliser le client Supabase côté client.
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type {
  EmailTemplate,
  EmailTemplateKey,
  EmailTemplateUpdatePayload,
} from '@/types/email-templates';

// ============================================
// TYPES INTERNES
// ============================================

/** Résultat d'une opération sur un template */
export interface EmailTemplateResult {
  data: EmailTemplate | null;
  error: string | null;
}

export interface EmailTemplatesListResult {
  data: EmailTemplate[] | null;
  error: string | null;
}

export interface EmailTemplateUpdateResult {
  data: EmailTemplate | null;
  error: string | null;
}

/**
 * Variables de substitution pour le rendu des textes éditables.
 * Toutes les valeurs doivent être déjà échappées (escapeHtml) avant
 * d'être passées à resolveTemplateVariables.
 */
export interface EmailTemplateVariables {
  prénom?: string;
  nom?: string;
  spectacle?: string;
  date?: string;
  heure?: string;
  lieu?: string;
  code?: string;
  organisation?: string;
}

// ============================================
// LECTURE
// ============================================

/**
 * Récupère un template email par sa clé technique.
 * Retourne null si le template n'existe pas ou est inactif.
 *
 * À utiliser côté serveur uniquement (routes API email).
 */
export async function getEmailTemplate(
  key: EmailTemplateKey
): Promise<EmailTemplateResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', key)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      logger.error('[email-templates] Erreur lecture template', {
        key,
        error: error.message,
      });
      return { data: null, error: error.message };
    }

    if (!data) {
      logger.warn('[email-templates] Template introuvable ou inactif', { key });
      return { data: null, error: null };
    }

    return { data: data as EmailTemplate, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email-templates] Exception getEmailTemplate', { key, message });
    return { data: null, error: message };
  }
}

/**
 * Récupère tous les templates (actifs et inactifs).
 * Réservé à l'UI admin (lecture via client serveur avec session admin).
 */
export async function getAllEmailTemplates(): Promise<EmailTemplatesListResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('[email-templates] Erreur liste templates', { error: error.message });
      return { data: null, error: error.message };
    }

    return { data: data as EmailTemplate[], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email-templates] Exception getAllEmailTemplates', { message });
    return { data: null, error: message };
  }
}

// ============================================
// ÉCRITURE (utilisé en S134B — UI admin)
// ============================================

/**
 * Met à jour les champs éditables d'un template.
 * Accessible en écriture uniquement pour les super-admins (RLS).
 */
export async function updateEmailTemplate(
  key: EmailTemplateKey,
  payload: EmailTemplateUpdatePayload
): Promise<EmailTemplateUpdateResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('email_templates')
      .update(payload)
      .eq('template_key', key)
      .select('*')
      .maybeSingle();

    if (error) {
      logger.error('[email-templates] Erreur mise à jour template', {
        key,
        error: error.message,
      });
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: `Template introuvable : ${key}` };
    }

    logger.info('[email-templates] Template mis à jour', { key });
    return { data: data as EmailTemplate, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email-templates] Exception updateEmailTemplate', { key, message });
    return { data: null, error: message };
  }
}

// ============================================
// SUBSTITUTION DES VARIABLES
// ============================================

/**
 * Substitue les variables {{clé}} dans un texte éditable.
 *
 * Les valeurs passées dans `variables` doivent être déjà
 * échappées via escapeHtml() avant appel (responsabilité de email.ts).
 *
 * Les variables non définies sont laissées intactes dans le texte.
 *
 * @example
 *   resolveTemplateVariables(
 *     'Bonjour {{prénom}}, votre réservation pour {{spectacle}}',
 *     { prénom: 'Marie', spectacle: 'Le Lac des cygnes' }
 *   )
 *   // → 'Bonjour Marie, votre réservation pour Le Lac des cygnes'
 */
export function resolveTemplateVariables(
  text: string,
  variables: EmailTemplateVariables
): string {
  if (!text) return '';

  return text
    .replace(/\{\{prénom\}\}/g,       variables.prénom       ?? '{{prénom}}')
    .replace(/\{\{nom\}\}/g,          variables.nom          ?? '{{nom}}')
    .replace(/\{\{spectacle\}\}/g,    variables.spectacle    ?? '{{spectacle}}')
    .replace(/\{\{date\}\}/g,         variables.date         ?? '{{date}}')
    .replace(/\{\{heure\}\}/g,        variables.heure        ?? '{{heure}}')
    .replace(/\{\{lieu\}\}/g,         variables.lieu         ?? '{{lieu}}')
    .replace(/\{\{code\}\}/g,         variables.code         ?? '{{code}}')
    .replace(/\{\{organisation\}\}/g, variables.organisation ?? '{{organisation}}');
}

/**
 * Convertit un texte multi-lignes (retours chariot \n) en HTML.
 * Utilisé pour rendre intro_text et body_text dans les templates HTML.
 *
 * @example
 *   textToHtml('Bonjour,\n\nVotre réservation...')
 *   // → 'Bonjour,<br /><br />Votre réservation...'
 */
export function textToHtml(text: string): string {
  if (!text) return '';
  return text.replace(/\n/g, '<br />');
}
