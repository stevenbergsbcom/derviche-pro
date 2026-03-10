/**
 * Service Maintenance — Purge et reset des données
 * Derviche Diffusion
 *
 * Fonctions réservées au super-admin :
 * - getPurgeCount()          : nombre de notifications purgables (> 90j)
 * - purgeOldNotifications()  : hard delete des notifications > 90j
 * - resetData(options)       : remise à zéro des données transactionnelles
 *
 * Les vérifications de rôle sont faites côté SQL (SECURITY DEFINER).
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

// Les RPC de maintenance ne sont pas encore dans les types auto-générés.
// On caste le client pour bypasser la vérification de nom de fonction.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any>;

// ============================================
// TYPES
// ============================================

export interface ResetOptions {
  /** Supprimer les profils professionnels & compagnies */
  profiles: boolean;
  /** Supprimer spectacles, créneaux & lieux */
  showsAndSlots: boolean;
  /** Supprimer les comptes Auth Supabase (pro & company) */
  authUsers: boolean;
}

export interface PurgeResult {
  success: boolean;
  deleted?: number;
  error?: string;
}

export interface ResetResult {
  success: boolean;
  deleted?: Record<string, number>;
  error?: string;
}

// ============================================
// PURGE DES NOTIFICATIONS
// ============================================

/**
 * Retourne le nombre de notifications admin de plus de 90 jours.
 */
export async function getPurgeCount(): Promise<number> {
  const supabase = createClient();

  const { data, error } = await (supabase as AnySupabaseClient).rpc('count_old_notifications', {
    days_old: 90,
  });

  if (error) {
    logger.error('[maintenance] Erreur count_old_notifications', { error });
    return 0;
  }

  const result = data as { success: boolean; count?: number; error?: string };
  if (!result.success) {
    logger.warn('[maintenance] count_old_notifications refusé', { result });
    return 0;
  }

  return result.count ?? 0;
}

/**
 * Hard delete des notifications admin de plus de 90 jours.
 */
export async function purgeOldNotifications(): Promise<PurgeResult> {
  const supabase = createClient();

  const { data, error } = await (supabase as AnySupabaseClient).rpc('purge_old_notifications', {
    days_old: 90,
  });

  if (error) {
    logger.error('[maintenance] Erreur purge_old_notifications', { error });
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; deleted?: number; error?: string };

  if (!result.success) {
    logger.warn('[maintenance] purge_old_notifications refusé', { result });
    return { success: false, error: result.error ?? 'Erreur inconnue' };
  }

  logger.info('[maintenance] Notifications purgées', { deleted: result.deleted });
  return { success: true, deleted: result.deleted ?? 0 };
}

// ============================================
// RESET DES DONNÉES
// ============================================

/**
 * Remise à zéro des données transactionnelles.
 * Les tables obligatoires sont toujours vidées :
 *   reservations, admin_notifications, sent_notifications, checkin_followup_emails
 *
 * Les tables optionnelles dépendent des options passées.
 * Si options.authUsers = true, appelle en plus la route API /api/admin/reset-auth-users.
 */
export async function resetData(options: ResetOptions): Promise<ResetResult> {
  const supabase = createClient();

  // ── 1. RPC SQL ─────────────────────────────────────────────────────────────
  const { data, error } = await (supabase as AnySupabaseClient).rpc('reset_data', {
    options: {
      profiles: options.profiles,
      showsAndSlots: options.showsAndSlots,
    },
  });

  if (error) {
    logger.error('[maintenance] Erreur reset_data', { error });
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; deleted?: Record<string, number>; error?: string };

  if (!result.success) {
    logger.warn('[maintenance] reset_data refusé', { result });
    return { success: false, error: result.error ?? 'Erreur inconnue' };
  }

  // ── 2. Suppression Auth Supabase (optionnel) ───────────────────────────────
  if (options.authUsers) {
    try {
      const res = await fetch('/api/admin/reset-auth-users', { method: 'POST' });
      const json = await res.json() as { success: boolean; deleted?: number; error?: string };

      if (!json.success) {
        logger.warn('[maintenance] reset-auth-users échoué', { json });
        return {
          success: false,
          error: json.error ?? 'Erreur suppression comptes Auth',
        };
      }

      logger.info('[maintenance] Comptes Auth supprimés', { deleted: json.deleted });
    } catch (err) {
      logger.error('[maintenance] Erreur fetch reset-auth-users', { err });
      return { success: false, error: 'Impossible de contacter la route reset-auth-users' };
    }
  }

  logger.info('[maintenance] Reset données effectué', { deleted: result.deleted, options });
  return { success: true, deleted: result.deleted };
}
