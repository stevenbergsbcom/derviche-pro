/**
 * API Route - Activer/Désactiver un utilisateur interne
 * PATCH /api/admin/users/[userId]/status
 * 
 * Seuls les Super Admins peuvent désactiver des utilisateurs.
 * Les Super Admins ne peuvent pas être désactivés.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { logSystem } from '@/lib/services/logs';
import {
  requireAuth,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
} from '@/lib/api';

// ============================================
// TYPES
// ============================================

interface StatusRequest {
  disabled: boolean;
}

interface RouteContext {
  params: Promise<{ userId: string }>;
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { userId } = await context.params;
    
    logger.info('API /admin/users/[userId]/status - Début', { userId });

    // 1. Vérifier que l'appelant est authentifié et est Super Admin
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['super-admin'], 'API /admin/users/[userId]/status');
    if (!auth.ok) return auth.response;

    // 2. Empêcher l'auto-désactivation
    if (auth.userId === userId) {
      logger.warn('API /admin/users/[userId]/status - Tentative auto-désactivation', { userId });
      return errorResponse('Vous ne pouvez pas modifier votre propre statut');
    }

    // 4. Parser la requête
    const body = await request.json() as StatusRequest;
    const shouldDisable = body.disabled === true;

    // 5. Vérifier que l'utilisateur cible existe, n'est pas supprimé, et est un utilisateur interne
    const supabaseAdmin = createAdminClient();
    
    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        disabled_at,
        user_roles!inner (role)
      `)
      .eq('id', userId)
      .is('deleted_at', null)
      .in('user_roles.role', ['super-admin', 'admin', 'externe'])
      .single();

    if (fetchError || !targetUser) {
      logger.warn('API /admin/users/[userId]/status - Utilisateur non trouvé ou non interne', {
        userId,
        error: fetchError?.message
      });
      return notFoundResponse('Utilisateur non trouvé ou non autorisé');
    }

    // 6. Empêcher la DÉSACTIVATION d'un Super Admin (mais permettre la réactivation)
    // user_roles peut être un tableau ou un objet selon la config Supabase
    const userRoles = targetUser.user_roles;
    let targetRoleValue: string | undefined;
    
    if (Array.isArray(userRoles) && userRoles.length > 0) {
      targetRoleValue = (userRoles[0] as { role: string }).role;
    } else if (userRoles && typeof userRoles === 'object' && !Array.isArray(userRoles) && 'role' in userRoles) {
      targetRoleValue = (userRoles as { role: string }).role;
    }
    
    // Sécurité : si on ne peut pas déterminer le rôle, on refuse la désactivation
    if (!targetRoleValue && shouldDisable) {
      logger.error('API /admin/users/[userId]/status - Impossible de déterminer le rôle', { 
        userId,
        userRoles: JSON.stringify(userRoles)
      });
      return serverErrorResponse('Impossible de vérifier le rôle de l\'utilisateur');
    }

    if (targetRoleValue === 'super-admin' && shouldDisable) {
      logger.warn('API /admin/users/[userId]/status - Tentative désactivation Super Admin', {
        userId,
        email: targetUser.email
      });
      return errorResponse('Les Super Admins ne peuvent pas être désactivés');
    }
    
    // Note: La réactivation d'un Super Admin est autorisée (cas exceptionnel si désactivé par erreur en BDD)

    // 7. Mettre à jour le statut
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        disabled_at: shouldDisable ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      logger.error('API /admin/users/[userId]/status - Erreur mise à jour', {
        userId,
        error: updateError.message
      });
      return serverErrorResponse('Erreur lors de la mise à jour du statut');
    }

    const action = shouldDisable ? 'désactivé' : 'réactivé';
    logger.info(`API /admin/users/[userId]/status - Compte ${action}`, {
      userId,
      email: targetUser.email
    });

    void logSystem(shouldDisable ? 'user_disable' : 'user_enable', 'info', {
      user_id: userId,
      email: targetUser.email,
    }, auth.userId, auth.role);

    return successResponse({ disabled: shouldDisable });

  } catch (error) {
    logger.error('API /admin/users/[userId]/status - Exception', { error });
    return serverErrorResponse();
  }
}
