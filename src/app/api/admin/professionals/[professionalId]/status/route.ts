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

// ============================================
// TYPES
// ============================================

interface StatusRequest {
  disabled: boolean;
}

interface StatusResponse {
  success: boolean;
  disabled?: boolean;
  error?: string;
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
): Promise<NextResponse<StatusResponse>> {
  try {
    const { professionalId } = await context.params;
    logger.info('API /admin/professionals/[id]/status - Début', { professionalId });

    // 1. Vérifier authentification
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 2. Vérifier rôle admin ou super-admin (les deux peuvent gérer les pros)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .in('role', ['super-admin', 'admin'])
      .single();

    if (!roleData) {
      logger.warn('API /admin/professionals/[id]/status - Droits insuffisants', {
        userId: currentUser.id,
      });
      return NextResponse.json(
        { success: false, error: 'Droits insuffisants' },
        { status: 403 }
      );
    }

    // 3. Parser la requête
    const body = (await request.json()) as StatusRequest;
    const shouldDisable = body.disabled === true;

    const supabaseAdmin = createAdminClient();

    // 4. Vérifier que la cible existe et a bien le rôle 'professional'
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
      return NextResponse.json(
        { success: false, error: 'Professionnel non trouvé' },
        { status: 404 }
      );
    }

    // 5. Mettre à jour le statut
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
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour du statut' },
        { status: 500 }
      );
    }

    const action = shouldDisable ? 'désactivé' : 'réactivé';
    logger.info(`API /admin/professionals/[id]/status - Compte ${action}`, {
      professionalId,
      email: targetProfile.email,
    });

    return NextResponse.json({ success: true, disabled: shouldDisable });
  } catch (error) {
    logger.error('API /admin/professionals/[id]/status - Exception', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
