/**
 * Cron Route — Rappels journaliers (J-7 et J-2)
 * GET /api/cron/reminders/daily
 *
 * Déclenchement : 0 7 * * * (7h UTC = 9h Paris été / 8h Paris hiver)
 * Sécurité : CRON_SECRET requis dans le header Authorization: Bearer <secret>
 *
 * Traite séquentiellement J-7 puis J-2.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { processMultipleReminders } from '@/lib/services/email/reminders';
import { DAILY_REMINDER_CONFIGS } from '@/lib/services/email/reminders';
import { requireCronAuth, getErrorMessage, serverErrorResponse } from '@/lib/api';

// Force le mode dynamique — désactive le cache Next.js pour les crons
export const dynamic = 'force-dynamic';

// ============================================
// HANDLER
// ============================================

export async function GET(request: Request): Promise<NextResponse> {
  const start = Date.now();

  const auth = requireCronAuth(request, '[cron/daily]');
  if (!auth.ok) return auth.response;

  logger.info('[cron/daily] Démarrage rappels journaliers (J-7 + J-2)');

  try {
    const summary = await processMultipleReminders(Object.values(DAILY_REMINDER_CONFIGS));

    const totalSent   = summary.reduce((acc, r) => acc + r.sent,   0);
    const totalFailed = summary.reduce((acc, r) => acc + r.failed, 0);
    const durationMs  = Date.now() - start;

    logger.info('[cron/daily] Rappels journaliers terminés', {
      totalSent,
      totalFailed,
      durationMs,
    });

    return NextResponse.json({
      ok:       true,
      summary,
      totalSent,
      totalFailed,
      durationMs,
    });
  } catch (err) {
    logger.error('[cron/daily] Exception non gérée', { message: getErrorMessage(err) });
    return serverErrorResponse();
  }
}
