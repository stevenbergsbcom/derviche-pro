/**
 * API Route - Suppression d'un utilisateur interne
 * DELETE /api/admin/users/[userId]
 * 
 * Soft delete : met à jour deleted_at sur le profil
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface DeleteUserResponse {
  success: boolean;
  error?: string;
}

interface RouteContext {
  params: Promise<{ userId: string }>;
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function DELETE(
  request: Request,
  context: RouteContext
): Promise<NextResponse<DeleteUserResponse>> {
  try {
    const { userId } = await context.params;
    
    logger.info('API /admin/users/[userId] DELETE - Début suppression', { userId });

    // 1. Vérifier que l'appelant est authentifié
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      logger.warn('API /admin/users/[userId] DELETE - Non authentifié');
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 2. Empêcher l'auto-suppression
    if (currentUser.id === userId) {
      logger.warn('API /admin/users/[userId] DELETE - Tentative auto-suppression', { userId });
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    // 3. Vérifier que l'utilisateur a un rôle admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .in('role', ['super-admin', 'admin'])
      .single();

    if (!roleData) {
      logger.warn('API /admin/users/[userId] DELETE - Droits insuffisants', { userId: currentUser.id });
      return NextResponse.json(
        { success: false, error: 'Droits insuffisants' },
        { status: 403 }
      );
    }

    // 4. Vérifier que l'utilisateur cible existe et est un utilisateur interne
    const supabaseAdmin = createAdminClient();
    
    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        user_roles!inner (role)
      `)
      .eq('id', userId)
      .is('deleted_at', null)
      .in('user_roles.role', ['super-admin', 'admin', 'externe-dd'])
      .single();

    if (fetchError || !targetUser) {
      logger.warn('API /admin/users/[userId] DELETE - Utilisateur non trouvé', { userId, error: fetchError?.message });
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé ou non interne' },
        { status: 404 }
      );
    }

    // 5. Soft delete : mettre à jour deleted_at
    const { error: deleteError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (deleteError) {
      logger.error('API /admin/users/[userId] DELETE - Erreur suppression', { 
        userId, 
        error: deleteError.message 
      });
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    logger.info('API /admin/users/[userId] DELETE - Succès', { userId, email: targetUser.email });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('API /admin/users/[userId] DELETE - Exception', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
