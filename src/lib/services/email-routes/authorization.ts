/**
 * Autorisation — routes email
 * Derviche Diffusion
 *
 * Factorise les checks d'accès répétés dans 4 routes email :
 *   - cancellation / modification : owner OU full-admin OU externe assigné
 *   - confirmation-by-id          : full-admin OU externe assigné
 *   - checkin-followup            : full-admin OU externe assigné OU company de la compagnie
 *
 * Le helper reçoit un contexte explicite (userId, role, user_id de la résa,
 * hosted_by_id, show.company_id) et valide l'accès selon les options passées.
 *
 * Retour :
 *   - null si l'accès est autorisé
 *   - une NextResponse 403 prête à servir sinon (log warn côté serveur)
 */

import type { NextResponse } from 'next/server';
import { forbiddenResponse } from '@/lib/api';
import { logger } from '@/lib/logger';
import type { AdminClient, AuthorizeContext, EmailRouteAuthOptions } from './types';

/**
 * Valide l'accès d'un utilisateur à une route email selon les options passées.
 *
 * Ordre d'évaluation (premier match → accès autorisé) :
 *   1. full-admin (super-admin / admin)
 *   2. owner (reservation.user_id === userId)
 *   3. externe assigné (slots.hosted_by_id === userId)
 *   4. company de la compagnie (profiles.company_id === show.company_id)
 *
 * Si aucune condition ne s'applique → NextResponse 403.
 */
export async function authorizeEmailRouteAccess(
  adminClient: AdminClient,
  ctx: AuthorizeContext,
  options: EmailRouteAuthOptions,
  routeLabel: string,
): Promise<NextResponse | null> {
  const { userId, userRole, reservationUserId, hostedById, showCompanyId } = ctx;

  // 1. Full admin
  if (options.allowFullAdmin && (userRole === 'super-admin' || userRole === 'admin')) {
    return null;
  }

  // 2. Owner
  if (options.allowOwner && reservationUserId !== null && reservationUserId === userId) {
    return null;
  }

  // 3. Externe assigné
  if (options.allowExterne && userRole === 'externe') {
    if (hostedById && hostedById === userId) return null;
    logger.warn(`${routeLabel} Externe non assigné à ce spectacle`, {
      userId,
      hostedById: hostedById ?? null,
    });
    return forbiddenResponse('Accès refusé');
  }

  // 4. Company de la compagnie
  if (options.allowCompany && userRole === 'company') {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .maybeSingle();

    const userCompanyId = profile?.company_id ?? null;

    if (userCompanyId && showCompanyId && userCompanyId === showCompanyId) {
      return null;
    }

    logger.warn(`${routeLabel} Company non autorisée`, {
      userId,
      userCompanyId,
      showCompanyId: showCompanyId ?? null,
    });
    return forbiddenResponse('Accès refusé');
  }

  // Aucun critère d'accès remplis → refus
  logger.warn(`${routeLabel} Accès refusé`, {
    userId,
    role: userRole,
    reservationUserId,
  });
  return forbiddenResponse('Accès refusé');
}
