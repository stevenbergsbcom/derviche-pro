/**
 * API Route - Gestion d'un utilisateur interne/company
 * DELETE /api/admin/users/[userId] - Soft delete
 * PATCH /api/admin/users/[userId] - Mise à jour profil et/ou rôle
 */

import type { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { logSystem } from '@/lib/services/logs';
import {
  requireAuth,
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
} from '@/lib/api';

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
  company_id?: string | null; // Requis si role = 'company'
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

    // 1. Vérifier que l'appelant est authentifié et a les droits admin
    const supabase = await createClient();
    const auth = await requireAuth(supabase, undefined, 'API /admin/users/[userId] DELETE');
    if (!auth.ok) return auth.response;

    // 2. Empêcher l'auto-suppression
    if (auth.userId === userId) {
      logger.warn('API /admin/users/[userId] DELETE - Tentative auto-suppression', { userId });
      return errorResponse('Vous ne pouvez pas supprimer votre propre compte');
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
      return notFoundResponse('Utilisateur non trouvé');
    }

    // 4.1 SÉCURITÉ : seul un super-admin peut supprimer un super-admin.
    // Defense-in-depth : même si l'UI filtre la liste, on re-valide ici.
    const targetRoles = targetUser.user_roles;
    let targetRole: string | undefined;
    if (Array.isArray(targetRoles) && targetRoles.length > 0) {
      targetRole = (targetRoles[0] as { role?: string })?.role;
    } else if (targetRoles && typeof targetRoles === 'object' && !Array.isArray(targetRoles)) {
      targetRole = (targetRoles as { role?: string }).role;
    }

    if (targetRole === 'super-admin' && auth.role !== 'super-admin') {
      logger.warn('API /admin/users/[userId] DELETE - Tentative suppression super-admin par non-super-admin', {
        userId,
        actorId: auth.userId,
        actorRole: auth.role,
      });
      return forbiddenResponse(
        'Seul un super-administrateur peut supprimer un compte super-admin',
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
      return serverErrorResponse('Erreur lors de la suppression');
    }

    logger.info('API /admin/users/[userId] DELETE - Succès', { userId, email: targetUser.email });

    void logSystem('user_delete', 'info', {
      user_id: userId,
      email: targetUser.email,
    }, auth.userId, auth.role);

    return successResponse();

  } catch (error) {
    logger.error('API /admin/users/[userId] DELETE - Exception', { error });
    return serverErrorResponse();
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

    // 1. Vérifier que l'appelant est authentifié et a les droits admin
    const supabase = await createClient();
    const auth = await requireAuth(supabase, undefined, 'API /admin/users/[userId] PATCH');
    if (!auth.ok) return auth.response;

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
      return notFoundResponse('Utilisateur non trouvé');
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
      return serverErrorResponse('Erreur lors de la mise à jour du profil');
    }

    // 5. Gérer le changement de rôle et/ou company_id
    const { company_id: newCompanyId } = body;

    // Interdire le changement de rôle si l'utilisateur est déjà 'company'
    if (newRole && newRole !== currentRole && currentRole === 'company') {
      logger.warn('API /admin/users/[userId] PATCH - Changement rôle company interdit', { userId });
      return errorResponse('Le rôle d\'un utilisateur compagnie ne peut pas être changé');
    }

    // 5.1 Dissociation : company_id explicitement à null sur un utilisateur 'company'
    if (newCompanyId === null && currentRole === 'company' && !newRole) {
      logger.info('API /admin/users/[userId] PATCH - Tentative dissociation', { 
        userId, 
        currentRole,
        newCompanyId 
      });

      const { error: unlinkError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          company_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (unlinkError) {
        logger.error('API /admin/users/[userId] PATCH - Erreur dissociation company_id', { 
          userId, 
          errorCode: unlinkError.code,
          errorMessage: unlinkError.message,
          errorDetails: unlinkError.details,
          errorHint: unlinkError.hint,
        });
        return serverErrorResponse(`Erreur lors de la dissociation: ${unlinkError.message}`);
      }

      logger.info('API /admin/users/[userId] PATCH - Utilisateur dissocié de sa compagnie', { userId });
      return successResponse();
    }

    // Si le nouveau rôle est 'company', vérifier company_id
    if (newRole === 'company') {
      if (!newCompanyId) {
        logger.warn('API /admin/users/[userId] PATCH - company_id manquant', { userId });
        return errorResponse('company_id est requis pour le rôle compagnie');
      }

      // Vérifier que la compagnie existe
      const { data: companyData, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id, name')
        .eq('id', newCompanyId)
        .is('deleted_at', null)
        .single();

      if (companyError || !companyData) {
        logger.warn('API /admin/users/[userId] PATCH - Compagnie non trouvée', { userId, newCompanyId });
        return errorResponse('Compagnie non trouvée');
      }

      // Vérifier qu'aucun autre utilisateur 'company' n'est déjà associé à cette compagnie
      // (On exclut l'utilisateur actuel de la vérification)
      const { data: companyRoleUsers } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'company');

      const companyUserIds = (companyRoleUsers || [])
        .map(u => u.user_id)
        .filter(id => id !== userId); // Exclure l'utilisateur actuel

      if (companyUserIds.length > 0) {
        const { data: existingCompanyUser } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('company_id', newCompanyId)
          .is('deleted_at', null)
          .in('id', companyUserIds)
          .maybeSingle();

        if (existingCompanyUser) {
          logger.warn('API /admin/users/[userId] PATCH - Compagnie a déjà un utilisateur', { 
            userId, 
            newCompanyId,
            existingUserId: existingCompanyUser.id 
          });
          return errorResponse(`Cette compagnie a déjà un accès utilisateur (${existingCompanyUser.email})`);
        }
      }

      // Mettre à jour company_id dans le profil
      const { error: companyUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          company_id: newCompanyId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (companyUpdateError) {
        logger.error('API /admin/users/[userId] PATCH - Erreur mise à jour company_id', {
          userId,
          error: companyUpdateError.message
        });
        return serverErrorResponse('Erreur lors de l\'association à la compagnie');
      }

      logger.info('API /admin/users/[userId] PATCH - company_id mis à jour', { userId, newCompanyId, companyName: companyData.name });
    }

    // Si on change vers un rôle interne, supprimer company_id
    if (newRole && INTERNAL_ROLES.includes(newRole) && currentRole === 'company') {
      // Ce cas ne devrait pas arriver car on bloque le changement depuis 'company'
      // Mais par sécurité...
    } else if (newRole && INTERNAL_ROLES.includes(newRole) && newRole !== currentRole) {
      // Changement entre rôles internes - supprimer company_id si présent
      const { error: clearCompanyError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          company_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (clearCompanyError) {
        logger.warn('API /admin/users/[userId] PATCH - Erreur suppression company_id', { 
          userId, 
          error: clearCompanyError.message 
        });
        // On continue quand même, ce n'est pas critique
      }
    }

    // Mettre à jour le rôle si nécessaire
    if (newRole && newRole !== currentRole) {
      // Valider le nouveau rôle
      if (!MANAGED_ROLES.includes(newRole)) {
        logger.warn('API /admin/users/[userId] PATCH - Rôle invalide', { userId, newRole });
        return errorResponse('Rôle invalide');
      }

      // SÉCURITÉ : seul un super-admin peut assigner/retirer le rôle super-admin.
      // Un admin qui tenterait de s'auto-promouvoir (ou de promouvoir qqn d'autre)
      // via une requête PATCH directe serait bloqué ici (defense-in-depth côté
      // serveur ; le dropdown côté client masque déjà l'option).
      if (auth.role !== 'super-admin') {
        if (newRole === 'super-admin' || currentRole === 'super-admin') {
          logger.warn('API /admin/users/[userId] PATCH - Tentative assignation super-admin par non-super-admin', {
            userId,
            actorId: auth.userId,
            actorRole: auth.role,
            newRole,
            currentRole,
          });
          return forbiddenResponse(
            'Seul un super-administrateur peut attribuer ou retirer le rôle super-admin',
          );
        }
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
        return serverErrorResponse('Erreur lors de la mise à jour du rôle');
      }

      logger.info('API /admin/users/[userId] PATCH - Rôle mis à jour', { userId, oldRole: currentRole, newRole });
    }

    logger.info('API /admin/users/[userId] PATCH - Succès', { userId, email: targetUser.email });

    void logSystem('user_update', 'info', {
      user_id: userId,
      email: targetUser.email,
      new_role: newRole ?? undefined,
    }, auth.userId, auth.role);

    return successResponse();

  } catch (error) {
    logger.error('API /admin/users/[userId] PATCH - Exception', { error });
    return serverErrorResponse();
  }
}
