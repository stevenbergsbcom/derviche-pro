/**
 * API Route — Compteur de notifications non lues (badge)
 * GET /api/admin/notifications/unread-count
 *
 * Endpoint ultra-léger dédié au polling du badge. Contrairement à
 * `/api/admin/notifications?limit=1` (qui chargeait la liste + counts), il
 * appelle la RPC `get_admin_unread_count` (migration 127) → 1 seul
 * aller-retour DB. Optimisation Fluid CPU Vercel (le polling du badge était
 * le poste n°1 de consommation).
 *
 * Sécurité :
 * - Authentification requise (session cookie)
 * - La RPC elle-même vérifie le rôle admin/super-admin (renvoie 0 sinon)
 */

import { createClient } from '@/lib/supabase/server';
import { getAdminUnreadCountFast } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';
import { requireAuth, successResponse, serverErrorResponse } from '@/lib/api';

export async function GET(): Promise<Response> {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, undefined, '[notifications unread-count API]');
    if (!auth.ok) return auth.response;

    const { count } = await getAdminUnreadCountFast();

    return successResponse({ unreadCount: count });
  } catch (err) {
    logger.error('[notifications unread-count API] Exception GET', { err });
    return serverErrorResponse();
  }
}
