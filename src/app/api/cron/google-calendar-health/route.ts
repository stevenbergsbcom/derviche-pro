/**
 * Cron Route — Vérification santé du token Google Calendar
 * GET /api/cron/google-calendar-health
 *
 * Valide le refresh_token en obtenant un access_token.
 * Double fonction :
 *   1. Détecte proactivement un token expiré/révoqué
 *   2. Empêche l'expiration par inactivité (> 6 mois)
 *
 * Déclenchement : via GitHub Actions (cron-daily.yml) après les rappels et la purge.
 * Sécurité : CRON_SECRET requis dans le header Authorization: Bearer <secret>
 */

import { NextResponse } from 'next/server';
import { checkGoogleCalendarTokenHealth } from '@/lib/services/google-calendar';
import { logger } from '@/lib/logger';
import { requireCronAuth, getErrorMessage, serverErrorResponse } from '@/lib/api';

// Force le mode dynamique — désactive le cache Next.js
export const dynamic = 'force-dynamic';

// ============================================
// HANDLER
// ============================================

export async function GET(request: Request): Promise<NextResponse> {
  const start = Date.now();

  const auth = requireCronAuth(request, '[cron/google-calendar-health]');
  if (!auth.ok) return auth.response;

  logger.info('[cron/google-calendar-health] Démarrage vérification santé token');

  try {
    const result = await checkGoogleCalendarTokenHealth();
    const durationMs = Date.now() - start;

    logger.info('[cron/google-calendar-health] Vérification terminée', {
      status: result.status,
      durationMs,
    });

    return NextResponse.json({
      ok:           true,
      status:       result.status,
      checkedAt:    result.checkedAt,
      errorMessage: result.errorMessage ?? null,
      durationMs,
    });
  } catch (err) {
    logger.error('[cron/google-calendar-health] Exception non gérée', {
      message: getErrorMessage(err),
    });
    return serverErrorResponse();
  }
}
