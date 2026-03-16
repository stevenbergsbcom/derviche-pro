/**
 * API Route - Activer/Désactiver un professionnel
 * PATCH /api/admin/professionals/[professionalId]/status
 *
 * Différent de /api/admin/users/[userId]/status qui gère les utilisateurs internes.
 * Cette route est dédiée aux professionnels (programmateurs) et accessible
 * aux super-admin ET admin (pas seulement super-admin).
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { logSystem } from '@/lib/services/logs';
import {
  requireAuth,
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
  params: Promise<{ professionalId: string }>;
}

// ============================================
// PATCH - Toggle statut professionnel
// ============================================

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { professionalId } = await context.params;
    logger.info('API /admin/professionals/[id]/status - Début', { professionalId });

    // 1. Vérifier authentification + rôle admin
    const supabase = await createClient();
    const auth = await requireAuth(supabase);
    if (!auth.ok) return auth.response;

    // 2. Parser la requête
    const body = (await request.json()) as StatusRequest;
    const shouldDisable = body.disabled === true;

    const supabaseAdmin = createAdminClient();

    // 3. Vérifier que la cible existe et a bien le rôle 'professional'
    const { data: targetProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        disabled_at,
        user_roles!inner (role)
      `)
      .eq('id', professionalId)
      .is('deleted_at', null)
      .eq('user_roles.role', 'professional')
      .single();

    if (fetchError || !targetProfile) {
      logger.warn('API /admin/professionals/[id]/status - Professionnel non trouvé', {
        professionalId,
        error: fetchError?.message,
      });
      return notFoundResponse('Professionnel non trouvé');
    }

    // 4. Mettre à jour le statut
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        disabled_at: shouldDisable ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', professionalId);

    if (updateError) {
      logger.error('API /admin/professionals/[id]/status - Erreur mise à jour', {
        professionalId,
        error: updateError.message,
      });
      return serverErrorResponse('Erreur lors de la mise à jour du statut');
    }

    const action = shouldDisable ? 'désactivé' : 'réactivé';
    logger.info(`API /admin/professionals/[id]/status - Compte ${action}`, {
      professionalId,
      email: targetProfile.email,
    });

    void logSystem(shouldDisable ? 'professional_disable' : 'professional_enable', 'info', {
      user_id: professionalId,
      email: targetProfile.email,
    }, auth.userId, auth.role);

    return successResponse({ disabled: shouldDisable });
  } catch (error) {
    logger.error('API /admin/professionals/[id]/status - Exception', { error });
    return serverErrorResponse();
  }
}
