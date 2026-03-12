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

// Force le mode dynamique — désactive le cache Next.js
export const dynamic = 'force-dynamic';

// ============================================
// VÉRIFICATION DU SECRET CRON
// ============================================

function verifyCronSecret(request: Request): { ok: boolean; status: number; message: string } {
  const cronSecret = process.env.CRON_SECRET;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev && !cronSecret) {
    logger.warn('[cron/google-calendar-health] CRON_SECRET non configuré — accès libre en développement');
    return { ok: true, status: 200, message: 'ok' };
  }

  if (!cronSecret) {
    logger.error('[cron/google-calendar-health] CRON_SECRET manquant en production');
    return { ok: false, status: 500, message: 'Configuration manquante : CRON_SECRET' };
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('[cron/google-calendar-health] Tentative d\'accès avec un secret invalide');
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
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[cron/google-calendar-health] Exception non gérée', { message });
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
