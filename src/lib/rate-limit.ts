/**
 * Rate Limiting — Derviche Pro
 *
 * Basé sur Upstash Redis (@upstash/ratelimit).
 * Algorithme Sliding Window : lisse les pics sans pénaliser les rafales légitimes.
 *
 * 3 limiters configurés :
 *   - reservations : POST /api/reservations (formulaire public)
 *   - emails       : POST /api/emails/*     (envois transactionnels)
 *   - auth         : POST /api/auth/*       (connexion / reset mdp)
 *
 * FAIL-OPEN : si Upstash est inaccessible, les requêtes passent toujours.
 * Une erreur de rate-limit ne doit JAMAIS bloquer une réservation légitime.
 *
 * Usage dans un route handler :
 *   const check = await checkRateLimit('reservations', request)
 *   if (!check.success) return rateLimitResponse(check)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis }     from '@upstash/redis';
import { NextResponse } from 'next/server';
import { logger }    from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export type RateLimitTarget = 'reservations' | 'emails' | 'auth';

export interface RateLimitResult {
  /** true = requête autorisée, false = bloquée */
  success:    boolean;
  /** Limite totale pour la fenêtre */
  limit:      number;
  /** Requêtes restantes */
  remaining:  number;
  /** Timestamp (ms) de réinitialisation de la fenêtre */
  reset:      number;
  /** Identifiant utilisé pour le bucket (IP ou userId) */
  identifier: string;
}

// ============================================
// INITIALISATION REDIS
// ============================================

/**
 * Crée le client Redis Upstash.
 * Retourne null si les variables d'env sont absentes (dev local sans Redis).
 */
function createRedisClient(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    logger.warn('[rate-limit] UPSTASH_REDIS_REST_URL ou TOKEN absent — rate limiting désactivé');
    return null;
  }

  return new Redis({ url, token });
}

// Singleton Redis (partagé entre les limiters)
const redis = createRedisClient();

// ============================================
// LIMITERS
// ============================================

/**
 * Crée un limiter Sliding Window, ou null si Redis absent.
 */
function createLimiter(
  requests: number,
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`,
): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(requests, window),
    analytics: false,
    prefix:    'derviche_rl',
  });
}

const limiters: Record<RateLimitTarget, Ratelimit | null> = {
  /**
   * Réservations publiques : 10 req / 10 min par IP
   * Un programmateur ne réserve jamais 10 fois en 10 min.
   */
  reservations: createLimiter(10, '10 m'),

  /**
   * Envois d'emails : 20 req / 1h par IP
   * Large pour les admins qui envoient plusieurs confirmations.
   */
  emails: createLimiter(20, '1 h'),

  /**
   * Auth (login / reset) : 5 req / 15 min par IP
   * Strict pour contrer le brute-force.
   */
  auth: createLimiter(5, '15 m'),
};

// ============================================
// HELPER : IDENTIFIER
// ============================================

/**
 * Extrait l'IP de la requête.
 * Priorité : x-forwarded-for (Vercel) → x-real-ip → fallback "unknown"
 */
export function getIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Vérifie le rate limit pour une cible donnée.
 *
 * @param target  - Type de route à protéger
 * @param request - Requête HTTP entrante (pour extraire l'IP)
 * @param userId  - Si fourni, combine IP + userId (plus précis)
 *
 * @returns RateLimitResult — toujours success=true si Redis est absent (fail-open)
 */
export async function checkRateLimit(
  target: RateLimitTarget,
  request: Request,
  userId?: string | null,
): Promise<RateLimitResult> {
  const limiter    = limiters[target];
  const ip         = getIdentifier(request);
  const identifier = userId ? `${ip}:${userId}` : ip;

  // Fail-open si Redis absent ou limiter non configuré
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0, identifier };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success:    result.success,
      limit:      result.limit,
      remaining:  result.remaining,
      reset:      result.reset,
      identifier,
    };
  } catch (err) {
    // Fail-open : si Upstash est down, ne pas bloquer les utilisateurs.
    // En dev local, l'instance Upstash a souvent des hoquets de connexion
    // (DNS, réseau) qui spamment la console sans valeur ajoutée — on
    // silence le warn en dev. En prod, on garde le warn (utile pour
    // détecter une vraie panne Upstash).
    if (process.env.NODE_ENV !== 'development') {
      logger.warn('[rate-limit] Erreur Upstash — fail-open activé', {
        target,
        identifier,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return { success: true, limit: 0, remaining: 0, reset: 0, identifier };
  }
}

// ============================================
// HELPER : RÉPONSE 429
// ============================================

/**
 * Crée une NextResponse HTTP 429 standardisée avec headers Retry-After.
 * Compatible avec tous les route handlers Next.js.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSeconds = Math.max(
    Math.ceil((result.reset - Date.now()) / 1000),
    1,
  );

  return NextResponse.json(
    {
      success: false,
      error:   'Trop de requêtes. Veuillez réessayer dans quelques instants.',
    },
    {
      status:  429,
      headers: {
        'Retry-After':           String(retryAfterSeconds),
        'X-RateLimit-Limit':     String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset':     String(result.reset),
      },
    },
  );
}
