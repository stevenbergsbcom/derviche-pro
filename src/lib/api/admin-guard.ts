/**
 * Utilitaire — Vérification d'accès admin pour les routes API
 *
 * Centralise le pattern répété dans 18+ routes :
 *   1. Vérifier que l'utilisateur est authentifié
 *   2. Vérifier qu'il possède un rôle autorisé
 *   3. Retourner userId + role, ou une NextResponse d'erreur
 *
 * Usage :
 *   const supabase = await createClient();
 *   const auth = await requireAuth(supabase);
 *   if (!auth.ok) return auth.response;
 *   // auth.userId et auth.role sont disponibles
 */

import { NextResponse } from 'next/server';
import type { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { unauthorizedResponse, forbiddenResponse } from './responses';

// ============================================
// TYPES
// ============================================

/** Résultat d'une vérification d'auth réussie */
export interface AuthSuccess {
  ok: true;
  userId: string;
  role: string;
}

/** Résultat d'une vérification d'auth échouée */
export interface AuthFailure {
  ok: false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: NextResponse<any>;
}

export type AuthResult = AuthSuccess | AuthFailure;

/** Rôles fréquemment utilisés */
export const ADMIN_ROLES = ['super-admin', 'admin'] as const;
export const STAFF_ROLES = ['super-admin', 'admin', 'externe', 'company'] as const;

// ============================================
// GUARD PRINCIPAL
// ============================================

/**
 * Vérifie l'authentification et le rôle de l'utilisateur courant.
 *
 * @param supabase - Client Supabase serveur (issu de createClient())
 * @param allowedRoles - Rôles autorisés (défaut : super-admin + admin)
 * @param logPrefix - Préfixe pour les messages de log (optionnel)
 *
 * @returns AuthSuccess avec userId et role, ou AuthFailure avec NextResponse prête à retourner
 *
 * @example
 *   const auth = await requireAuth(supabase);
 *   if (!auth.ok) return auth.response;
 *   console.log(auth.userId, auth.role);
 *
 * @example
 *   // Super-admin uniquement
 *   const auth = await requireAuth(supabase, ['super-admin']);
 *
 * @example
 *   // Tous les rôles staff
 *   const auth = await requireAuth(supabase, STAFF_ROLES);
 */
export async function requireAuth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  allowedRoles: readonly string[] = ADMIN_ROLES,
  logPrefix?: string,
): Promise<AuthResult> {
  // 1. Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: unauthorizedResponse() };
  }

  // 2. Vérifier le rôle
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const userRole = roleData?.role ?? null;

  if (!userRole || !allowedRoles.includes(userRole)) {
    if (logPrefix) {
      logger.warn(`${logPrefix} - Droits insuffisants`, {
        userId: user.id,
        role: userRole,
      });
    }
    return { ok: false, response: forbiddenResponse() };
  }

  return { ok: true, userId: user.id, role: userRole };
}
