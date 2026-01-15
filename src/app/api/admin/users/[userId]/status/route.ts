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
  params: Promise<{ userId: string }>;
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<NextResponse<StatusResponse>> {
  try {
    const { userId } = await context.params;
    
    logger.info('API /admin/users/[userId]/status - Début', { userId });

    // 1. Vérifier que l'appelant est authentifié
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      logger.warn('API /admin/users/[userId]/status - Non authentifié');
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 2. Vérifier que l'utilisateur est Super Admin (seul autorisé)
    const { data: currentUserRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .eq('role', 'super-admin')
      .single();

    if (!currentUserRole) {
      logger.warn('API /admin/users/[userId]/status - Droits insuffisants (Super Admin requis)', { 
        userId: currentUser.id 
      });
      return NextResponse.json(
        { success: false, error: 'Seuls les Super Admins peuvent modifier le statut des utilisateurs' },
        { status: 403 }
      );
    }

    // 3. Empêcher l'auto-désactivation
    if (currentUser.id === userId) {
      logger.warn('API /admin/users/[userId]/status - Tentative auto-désactivation', { userId });
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez pas modifier votre propre statut' },
        { status: 400 }
      );
    }

    // 4. Parser la requête
    const body = await request.json() as StatusRequest;
    const shouldDisable = body.disabled === true;

    // 5. Vérifier que l'utilisateur cible existe et n'est pas Super Admin
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
      .single();

    if (fetchError || !targetUser) {
      logger.warn('API /admin/users/[userId]/status - Utilisateur non trouvé', { 
        userId, 
        error: fetchError?.message 
      });
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // 6. Empêcher la DÉSACTIVATION d'un Super Admin (mais permettre la réactivation)
    const targetRole = targetUser.user_roles as unknown as { role: string };
    if (targetRole?.role === 'super-admin' && shouldDisable) {
      logger.warn('API /admin/users/[userId]/status - Tentative désactivation Super Admin', { 
        userId,
        email: targetUser.email 
      });
      return NextResponse.json(
        { success: false, error: 'Les Super Admins ne peuvent pas être désactivés' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour du statut' },
        { status: 500 }
      );
    }

    const action = shouldDisable ? 'désactivé' : 'réactivé';
    logger.info(`API /admin/users/[userId]/status - Compte ${action}`, { 
      userId, 
      email: targetUser.email 
    });

    return NextResponse.json({ 
      success: true,
      disabled: shouldDisable,
    });

  } catch (error) {
    logger.error('API /admin/users/[userId]/status - Exception', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
