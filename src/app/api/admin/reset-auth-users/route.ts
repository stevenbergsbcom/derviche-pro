/**
 * API Route — Suppression des comptes Auth Supabase (pro & company)
 * POST /api/admin/reset-auth-users
 *
 * Supprime les comptes Auth des utilisateurs ayant le rôle
 * 'professional' ou 'company' uniquement.
 *
 * Les comptes super-admin, admin et externe ne sont PAS touchés.
 *
 * Nécessite la service_role_key (createAdminClient).
 * Accès : super-admin uniquement.
 */

import { NextResponse }       from 'next/server';
import { createAdminClient }  from '@/lib/supabase/server-admin';
import { createClient }       from '@/lib/supabase/server';
import { logger }             from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface ResetAuthUsersResponse {
  success: boolean;
  deleted?: number;
  error?: string;
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(): Promise<NextResponse<ResetAuthUsersResponse>> {
  try {
    logger.info('API /admin/reset-auth-users - Début suppression comptes Auth');

    // ── 1. Vérifier que l'appelant est authentifié et super-admin ────────────
    const supabase     = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      logger.warn('API /admin/reset-auth-users - Non authentifié');
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 },
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .eq('role', 'super-admin')
      .single();

    if (!roleData) {
      logger.warn('API /admin/reset-auth-users - Droits insuffisants', { userId: currentUser.id });
      return NextResponse.json(
        { success: false, error: 'Accès refusé — super-admin requis' },
        { status: 403 },
      );
    }

    const supabaseAdmin = createAdminClient();

    // ── 2. Récupérer les user_ids ayant le rôle pro ou company ───────────────
    const { data: targetRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .in('role', ['professional', 'company']);

    if (rolesError) {
      logger.error('API /admin/reset-auth-users - Erreur lecture user_roles', { error: rolesError.message });
      return NextResponse.json(
        { success: false, error: 'Erreur lecture des rôles' },
        { status: 500 },
      );
    }

    if (!targetRoles || targetRoles.length === 0) {
      logger.info('API /admin/reset-auth-users - Aucun compte à supprimer');
      return NextResponse.json({ success: true, deleted: 0 });
    }

    // Sécurité supplémentaire : exclure explicitement les super-admin/admin/externe
    // au cas où un utilisateur aurait plusieurs rôles
    const { data: protectedRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .in('role', ['super-admin', 'admin', 'externe']);

    const protectedIds = new Set((protectedRoles ?? []).map(r => r.user_id));

    const userIdsToDelete = targetRoles
      .map(r => r.user_id)
      .filter((id): id is string => typeof id === 'string' && !protectedIds.has(id));

    if (userIdsToDelete.length === 0) {
      logger.info('API /admin/reset-auth-users - Tous les comptes sont protégés, rien à supprimer');
      return NextResponse.json({ success: true, deleted: 0 });
    }

    // ── 3. Supprimer les comptes Auth un par un ──────────────────────────────
    // Supabase Admin API ne propose pas de deleteUsers (bulk),
    // on itère donc en séquentiel pour éviter les race conditions.
    let deletedCount = 0;
    const errors: string[] = [];

    for (const userId of userIdsToDelete) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        logger.warn('API /admin/reset-auth-users - Erreur suppression user', {
          userId,
          error: deleteError.message,
        });
        errors.push(userId);
      } else {
        deletedCount++;
      }
    }

    if (errors.length > 0) {
      logger.warn('API /admin/reset-auth-users - Suppression partielle', {
        deleted: deletedCount,
        failed: errors.length,
      });
    }

    logger.info('API /admin/reset-auth-users - Terminé', {
      total:   userIdsToDelete.length,
      deleted: deletedCount,
      failed:  errors.length,
    });

    return NextResponse.json({ success: true, deleted: deletedCount });

  } catch (error) {
    logger.error('API /admin/reset-auth-users - Exception', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
