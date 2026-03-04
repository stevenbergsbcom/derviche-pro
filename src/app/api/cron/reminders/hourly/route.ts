/**
 * Cron Route — Rappel horaire (H-12)
 * GET /api/cron/reminders/hourly
 *
 * Déclenchement : 0 * * * * (toutes les heures)
 * Fenêtre détection : représentations dans [now+11h30, now+12h30]
 * Sécurité : CRON_SECRET requis dans le header Authorization: Bearer <secret>
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { processReminders } from '@/lib/services/email/reminders';
import { HOURLY_REMINDER_CONFIG } from '@/lib/services/email/reminders';

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
    logger.warn('[cron/hourly] CRON_SECRET non configuré — accès libre en développement');
    return { ok: true, status: 200, message: 'ok' };
  }

  // En prod sans secret : erreur de configuration
  if (!cronSecret) {
    logger.error('[cron/hourly] CRON_SECRET manquant en production');
    return { ok: false, status: 500, message: 'Configuration manquante : CRON_SECRET' };
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('[cron/hourly] Tentative d\'accès avec un secret invalide');
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

  logger.info('[cron/hourly] Démarrage rappel H-12');

  try {
    const result     = await processReminders(HOURLY_REMINDER_CONFIG);
    const durationMs = Date.now() - start;

    logger.info('[cron/hourly] Rappel H-12 terminé', {
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
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[cron/hourly] Exception non gérée', { message });
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
