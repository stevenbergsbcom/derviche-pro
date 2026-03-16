/**
 * Utilitaire — Guard d'authentification pour les routes cron
 *
 * Vérifie le CRON_SECRET via le header Authorization: Bearer <secret>.
 * En développement, autorise l'accès libre si le secret n'est pas configuré.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

type CronAuthSuccess = { ok: true };
type CronAuthFailure = { ok: false; response: NextResponse };
type CronAuthResult = CronAuthSuccess | CronAuthFailure;

// ============================================
// GUARD
// ============================================

/**
 * Vérifie l'authentification d'une requête cron.
 *
 * @param request - La requête entrante
 * @param logPrefix - Préfixe pour les logs (ex: '[cron/purge-logs]')
 * @returns `{ ok: true }` si autorisé, `{ ok: false, response }` sinon
 */
export function requireCronAuth(request: Request, logPrefix: string): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET;
  const isDev = process.env.NODE_ENV === 'development';

  // En dev sans secret : autorisé avec warning
  if (isDev && !cronSecret) {
    logger.warn(`${logPrefix} CRON_SECRET non configuré — accès libre en développement`);
    return { ok: true };
  }

  // En prod sans secret : erreur de configuration
  if (!cronSecret) {
    logger.error(`${logPrefix} CRON_SECRET manquant en production`);
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Configuration manquante : CRON_SECRET' },
        { status: 500 },
      ),
    };
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn(`${logPrefix} Tentative d'accès avec un secret invalide`);
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Non autorisé' },
        { status: 401 },
      ),
    };
  }

  return { ok: true };
}
