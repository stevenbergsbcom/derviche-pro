/**
 * Queries Helpers — Service Notifications Admin
 * Derviche Diffusion
 *
 * Helpers internes partagés entre queries-fetch et queries-mutations.
 */

import { createClient as createSupabaseServiceClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { AdminNotification, NotificationType } from './types';

// ============================================
// CONSTANTES
// ============================================

export const DEFAULT_PAGE_LIMIT = 20;

// ============================================
// CLIENT SERVICE ROLE (write-only, côté serveur)
// ============================================

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      '[notifications/queries] Variables NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes'
    );
  }

  return createSupabaseServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================
// TYPE INTERMÉDIAIRE (réponse brute Supabase)
// ============================================

export interface RawNotificationRow {
  id: string;
  type: string;
  reservation_id: string | null;
  professional_name: string;
  show_title: string;
  slot_date: string | null;
  message: string;
  created_at: string;
  /** LEFT JOIN reads — tableau vide = non lu par l'admin courant */
  reads: Array<{ notification_id: string }>;
}

// ============================================
// HELPERS
// ============================================

/** Transforme une ligne brute en AdminNotification typée */
export function transformRow(row: RawNotificationRow): AdminNotification {
  return {
    id:                row.id,
    type:              row.type as NotificationType,
    reservation_id:    row.reservation_id,
    professional_name: row.professional_name,
    show_title:        row.show_title,
    slot_date:         row.slot_date,
    message:           row.message,
    created_at:        row.created_at,
    // is_read = true si une ligne existe dans reads pour cet admin (RLS filtre par uid)
    is_read: row.reads.length > 0,
  };
}

/**
 * Récupère le dismissed_at de l'admin courant (ou null si jamais vidé).
 * Utilisé pour filtrer les notifications antérieures au dernier "Vider".
 */
export async function getDismissedAt(
  supabase: Awaited<ReturnType<typeof createServerClient>>
): Promise<string | null> {
  const { data, error } = await supabase
    .from('admin_notification_dismissals')
    .select('dismissed_at')
    .single();

  if (error || !data) return null;
  return data.dismissed_at as string;
}
