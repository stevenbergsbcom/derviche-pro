/**
 * API Route - Gestion d'un utilisateur interne/company
 * DELETE /api/admin/users/[userId] - Soft delete
 * PATCH /api/admin/users/[userId] - Mise à jour profil et/ou rôle
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface ApiResponse {
  success: boolean;
  error?: string;
}

interface RouteContext {
  params: Promise<{ userId: string }>;
}

interface UpdateUserBody {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role?: string;
}

/** Rôles gérés */
const MANAGED_ROLES = ['super-admin', 'admin', 'externe', 'company'];

/** Rôles internes (sans company) */
const INTERNAL_ROLES = ['super-admin', 'admin', 'externe'];

// ============================================
// DELETE - Suppression utilisateur
// ============================================

export async function DELETE(
  request: Request,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
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

    // 4. Vérifier que l'utilisateur cible existe et est un utilisateur géré
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
      .in('user_roles.role', MANAGED_ROLES)
      .single();

    if (fetchError || !targetUser) {
      logger.warn('API /admin/users/[userId] DELETE - Utilisateur non trouvé', { userId, error: fetchError?.message });
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
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

// ============================================
// PATCH - Mise à jour utilisateur
// ============================================

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  try {
    const { userId } = await context.params;
    const body = await request.json() as UpdateUserBody;
    
    logger.info('API /admin/users/[userId] PATCH - Début mise à jour', { userId, body });

    // 1. Vérifier que l'appelant est authentifié
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      logger.warn('API /admin/users/[userId] PATCH - Non authentifié');
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 2. Vérifier que l'utilisateur a un rôle admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .in('role', ['super-admin', 'admin'])
      .single();

    if (!roleData) {
      logger.warn('API /admin/users/[userId] PATCH - Droits insuffisants', { userId: currentUser.id });
      return NextResponse.json(
        { success: false, error: 'Droits insuffisants' },
        { status: 403 }
      );
    }

    // 3. Vérifier que l'utilisateur cible existe
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
      .in('user_roles.role', MANAGED_ROLES)
      .single();

    if (fetchError || !targetUser) {
      logger.warn('API /admin/users/[userId] PATCH - Utilisateur non trouvé', { userId, error: fetchError?.message });
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Extraire le rôle actuel
    const userRoles = targetUser.user_roles;
    let currentRole: string | undefined;
    if (Array.isArray(userRoles) && userRoles.length > 0) {
      currentRole = (userRoles[0] as { role?: string })?.role;
    } else if (userRoles && typeof userRoles === 'object' && !Array.isArray(userRoles)) {
      currentRole = (userRoles as { role?: string }).role;
    }

    // 4. Mettre à jour le profil
    const { first_name, last_name, phone, role: newRole } = body;
    
    const profileUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Ajouter les champs à mettre à jour
    if (first_name !== undefined) profileUpdates.first_name = first_name;
    if (last_name !== undefined) profileUpdates.last_name = last_name;
    if (phone !== undefined) profileUpdates.phone = phone;

    // Mettre à jour le profil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);

    if (profileError) {
      logger.error('API /admin/users/[userId] PATCH - Erreur profil', { 
        userId, 
        error: profileError.message 
      });
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour du profil' },
        { status: 500 }
      );
    }

    // 5. Mettre à jour le rôle si nécessaire (et si pas company)
    if (newRole && newRole !== currentRole && currentRole !== 'company') {
      // Valider le nouveau rôle
      if (!INTERNAL_ROLES.includes(newRole)) {
        logger.warn('API /admin/users/[userId] PATCH - Rôle invalide', { userId, newRole });
        return NextResponse.json(
          { success: false, error: 'Rôle invalide' },
          { status: 400 }
        );
      }

      // Mettre à jour le rôle
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (roleError) {
        logger.error('API /admin/users/[userId] PATCH - Erreur rôle', { 
          userId, 
          error: roleError.message 
        });
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la mise à jour du rôle' },
          { status: 500 }
        );
      }

      logger.info('API /admin/users/[userId] PATCH - Rôle mis à jour', { userId, oldRole: currentRole, newRole });
    }

    logger.info('API /admin/users/[userId] PATCH - Succès', { userId, email: targetUser.email });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('API /admin/users/[userId] PATCH - Exception', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
