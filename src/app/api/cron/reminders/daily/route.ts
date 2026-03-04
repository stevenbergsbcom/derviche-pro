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

// Force le mode dynamique — désactive le cache Next.js pour les crons
export const dynamic = 'force-dynamic';

// ============================================
// VÉRIFICATION DU SECRET CRON
// ============================================

function verifyCronSecret(request: Request): { ok: boolean; status: number; message: string } {
  const cronSecret = process.env.CRON_SECRET;
  const isDev = process.env.NODE_ENV === 'development';

  // En dev sans secret : autorisé avec warning
  if (isDev && !cronSecret) {
    logger.warn('[cron/daily] CRON_SECRET non configuré — accès libre en développement');
    return { ok: true, status: 200, message: 'ok' };
  }

  // En prod sans secret : erreur de configuration
  if (!cronSecret) {
    logger.error('[cron/daily] CRON_SECRET manquant en production');
    return { ok: false, status: 500, message: 'Configuration manquante : CRON_SECRET' };
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('[cron/daily] Tentative d\'accès avec un secret invalide');
    return { ok: false, status: 401, message: 'Non autorisé' };
  }

  return { ok: true, status: 200, message: 'ok' };
}

// ============================================
// HANDLER
// ============================================

export async function GET(request: Request): Promise<NextResponse> {
  const start = Date.now();

  const auth = verifyCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

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
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[cron/daily] Exception non gérée', { message });
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
