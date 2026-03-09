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

// Force le mode dynamique — désactive le cache Next.js
export const dynamic = 'force-dynamic';

// Rétention en jours
const RETENTION_DAYS = 90;

// ============================================
// VÉRIFICATION DU SECRET CRON
// ============================================

function verifyCronSecret(request: Request): { ok: boolean; status: number; message: string } {
  const cronSecret = process.env.CRON_SECRET;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev && !cronSecret) {
    logger.warn('[cron/purge-logs] CRON_SECRET non configuré — accès libre en développement');
    return { ok: true, status: 200, message: 'ok' };
  }

  if (!cronSecret) {
    logger.error('[cron/purge-logs] CRON_SECRET manquant en production');
    return { ok: false, status: 500, message: 'Configuration manquante : CRON_SECRET' };
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('[cron/purge-logs] Tentative d\'accès avec un secret invalide');
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
      return NextResponse.json({ ok: false, error: 'Erreur base de données' }, { status: 500 });
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
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[cron/purge-logs] Exception non gérée', { message });
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
