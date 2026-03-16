/**
 * Cron Route — Purge des logs système
 * GET /api/cron/purge-logs
 *
 * Supprime les entrées app_logs de plus de 90 jours.
 * Déclenchement : via GitHub Actions (cron-daily.yml) à 7h15 UTC.
 * Sécurité : CRON_SECRET requis dans le header Authorization: Bearer <secret>
 *
 * Rétention : 90 jours (configurable via LOGS_RETENTION_DAYS si besoin futur)
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { logger } from '@/lib/logger';
import { requireCronAuth, getErrorMessage, serverErrorResponse } from '@/lib/api';

// Force le mode dynamique — désactive le cache Next.js
export const dynamic = 'force-dynamic';

// Rétention en jours
const RETENTION_DAYS = 90;

// ============================================
// HANDLER
// ============================================

export async function GET(request: Request): Promise<NextResponse> {
  const start = Date.now();

  const auth = requireCronAuth(request, '[cron/purge-logs]');
  if (!auth.ok) return auth.response;

  logger.info(`[cron/purge-logs] Démarrage purge — rétention ${RETENTION_DAYS}j`);

  try {
    const supabase = createAdminClient();

    // Date limite : NOW() - 90 jours
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
    const cutoffIso = cutoff.toISOString();

    const { error, count } = await supabase
      .from('app_logs')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffIso);

    if (error) {
      logger.error('[cron/purge-logs] Erreur BDD lors de la purge', { error: error.message });
      return serverErrorResponse('Erreur base de données');
    }

    const deleted    = count ?? 0;
    const durationMs = Date.now() - start;

    logger.info('[cron/purge-logs] Purge terminée', { deleted, cutoffIso, durationMs });

    return NextResponse.json({
      ok:         true,
      deleted,
      cutoffDate: cutoffIso,
      durationMs,
    });
  } catch (err) {
    logger.error('[cron/purge-logs] Exception non gérée', { message: getErrorMessage(err) });
    return serverErrorResponse();
  }
}
