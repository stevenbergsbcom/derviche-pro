/**
 * Rate-limit wrapper — routes email
 * Derviche Diffusion
 *
 * Factorise le bloc répété dans les 5 routes /api/emails/send-* :
 *   - appel checkRateLimit('emails', request)
 *   - log système si bloqué
 *   - retour NextResponse 429 prête à servir, ou null si OK
 */

import type { NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSystem } from '@/lib/services/logs';

/**
 * Vérifie le rate-limit 'emails' et retourne une réponse d'erreur prête à
 * retourner si la limite est atteinte, sinon null.
 *
 * @example
 *   const limited = await withEmailRateLimit(request, '/api/emails/send-confirmation');
 *   if (limited) return limited;
 */
export async function withEmailRateLimit(
  request: Request,
  routeLabel: string,
): Promise<NextResponse | null> {
  const rl = await checkRateLimit('emails', request);
  if (!rl.success) {
    void logSystem('rate_limit_blocked', 'warning', {
      route: routeLabel,
      identifier: rl.identifier,
      limit: rl.limit,
    });
    return rateLimitResponse(rl);
  }
  return null;
}
