/**
 * Cron Route — Rappel horaire (H-4)
 * GET /api/cron/reminders/hourly
 *
 * Déclenchement : 0 * * * * (toutes les heures)
 * Fenêtre détection : représentations dans [now+3h30, now+4h30]
 * Sécurité : CRON_SECRET requis dans le header Authorization: Bearer <secret>
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { processReminders } from '@/lib/services/email/reminders';
import { HOURLY_REMINDER_CONFIG } from '@/lib/services/email/reminders';
import { requireCronAuth, getErrorMessage, serverErrorResponse } from '@/lib/api';

// Force le mode dynamique — désactive le cache Next.js pour les crons
export const dynamic = 'force-dynamic';

// ============================================
// HANDLER
// ============================================

export async function GET(request: Request): Promise<NextResponse> {
  const start = Date.now();

  const auth = requireCronAuth(request, '[cron/hourly]');
  if (!auth.ok) return auth.response;

  logger.info('[cron/hourly] Démarrage rappel H-4');

  try {
    const result     = await processReminders(HOURLY_REMINDER_CONFIG);
    const durationMs = Date.now() - start;

    logger.info('[cron/hourly] Rappel H-4 terminé', {
      enabled:  result.enabled,
      eligible: result.eligible,
      sent:     result.sent,
      failed:   result.failed,
      durationMs,
    });

    return NextResponse.json({
      ok: true,
      type:     result.type,
      enabled:  result.enabled,
      eligible: result.eligible,
      sent:     result.sent,
      failed:   result.failed,
      durationMs,
    });
  } catch (err) {
    logger.error('[cron/hourly] Exception non gérée', { message: getErrorMessage(err) });
    return serverErrorResponse();
  }
}
