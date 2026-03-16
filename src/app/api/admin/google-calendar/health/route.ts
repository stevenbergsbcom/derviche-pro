/**
 * API Route — Vérification manuelle santé token Google Calendar
 * POST /api/admin/google-calendar/health
 *
 * Déclenche une vérification immédiate du token OAuth2.
 * Écrit le résultat dans app_settings et retourne le statut.
 *
 * Sécurité :
 *   - Authentification requise
 *   - Rôle super-admin uniquement (la page /admin/systeme est super-admin)
 */

import { createClient } from '@/lib/supabase/server';
import { checkGoogleCalendarTokenHealth } from '@/lib/services/google-calendar';
import { logger } from '@/lib/logger';
import { requireAuth, successResponse, serverErrorResponse, getErrorMessage } from '@/lib/api';

// ============================================
// POST
// ============================================

export async function POST(): Promise<Response> {
  try {
    // 1. Vérification auth + rôle super-admin
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['super-admin'], '[google-calendar/health API]');
    if (!auth.ok) return auth.response;

    // 2. Vérification du token
    const result = await checkGoogleCalendarTokenHealth();

    logger.info('[google-calendar/health API] Vérification manuelle', {
      status: result.status,
      userId: auth.userId,
    });

    return successResponse(result);
  } catch (err) {
    const message = getErrorMessage(err);
    logger.error('[google-calendar/health API] Exception non gérée', { message });
    return serverErrorResponse();
  }
}
