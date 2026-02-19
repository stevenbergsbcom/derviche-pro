/**
 * API Route - Gestion d'un professionnel
 * PATCH /api/admin/professionals/[professionalId] - Mise à jour du profil complet
 * DELETE /api/admin/professionals/[professionalId] - Soft delete
 *
 * Accessible uniquement aux super-admin et admin.
 * Contrairement à /api/admin/users, cette route gère les champs
 * étendus du profil professionnel (structure, fonction, AFC, adresse, etc.)
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
  params: Promise<{ professionalId: string }>;
}

interface UpdateProfessionalBody {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email2?: string | null;
  phone2?: string | null;
  function?: string | null;
  structure?: string | null;
  afc_number?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  comments?: string | null;
}

// ============================================
// HELPER - Vérification accès admin
// ============================================

/**
 * Vérifie que l'appelant est authentifié et possède un rôle admin.
 * Retourne l'ID de l'utilisateur courant si autorisé, null sinon.
 */
async function checkAdminAccess(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ authorized: true; userId: string } | { authorized: false; response: NextResponse<ApiResponse> }> {
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      ),
    };
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', currentUser.id)
    .in('role', ['super-admin', 'admin'])
    .single();

  if (!roleData) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Droits insuffisants' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, userId: currentUser.id };
}

// ============================================
// PATCH - Mise à jour profil complet
// ============================================

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  try {
    const { professionalId } = await context.params;
    logger.info('API /admin/professionals/[id] PATCH - Début', { professionalId });

    const supabase = await createClient();
    const access = await checkAdminAccess(supabase);
    if (!access.authorized) return access.response;

    // Parser le body
    const body = (await request.json()) as UpdateProfessionalBody;

    const supabaseAdmin = createAdminClient();

    // Vérifier que l'utilisateur cible existe et a le rôle 'professional'
    const { data: targetProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        user_roles!inner (role)
      `)
      .eq('id', professionalId)
      .is('deleted_at', null)
      .eq('user_roles.role', 'professional')
      .single();

    if (fetchError || !targetProfile) {
      logger.warn('API /admin/professionals/[id] PATCH - Professionnel non trouvé', {
        professionalId,
        error: fetchError?.message,
      });
      return NextResponse.json(
        { success: false, error: 'Professionnel non trouvé' },
        { status: 404 }
      );
    }

    // Construire les champs à mettre à jour (ignorer les undefined)
    const profileUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const updatableFields: Array<keyof UpdateProfessionalBody> = [
      'first_name',
      'last_name',
      'phone',
      'email2',
      'phone2',
      'function',
      'structure',
      'afc_number',
      'address',
      'postal_code',
      'city',
      'country',
      'comments',
    ];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        profileUpdates[field] = body[field];
      }
    }

    // Effectuer la mise à jour
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', professionalId);

    if (updateError) {
      logger.error('API /admin/professionals/[id] PATCH - Erreur mise à jour', {
        professionalId,
        error: updateError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour du profil' },
        { status: 500 }
      );
    }

    logger.info('API /admin/professionals/[id] PATCH - Succès', {
      professionalId,
      email: targetProfile.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('API /admin/professionals/[id] PATCH - Exception', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Suppression (soft delete)
// ============================================

export async function DELETE(
  _request: Request,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  try {
    const { professionalId } = await context.params;
    logger.info('API /admin/professionals/[id] DELETE - Début', { professionalId });

    const supabase = await createClient();
    const access = await checkAdminAccess(supabase);
    if (!access.authorized) return access.response;

    const supabaseAdmin = createAdminClient();

    // Vérifier que l'utilisateur cible existe et a le rôle 'professional'
    const { data: targetProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        user_roles!inner (role)
      `)
      .eq('id', professionalId)
      .is('deleted_at', null)
      .eq('user_roles.role', 'professional')
      .single();

    if (fetchError || !targetProfile) {
      logger.warn('API /admin/professionals/[id] DELETE - Professionnel non trouvé', {
        professionalId,
        error: fetchError?.message,
      });
      return NextResponse.json(
        { success: false, error: 'Professionnel non trouvé' },
        { status: 404 }
      );
    }

    // Soft delete
    const { error: deleteError } = await supabaseAdmin
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', professionalId);

    if (deleteError) {
      logger.error('API /admin/professionals/[id] DELETE - Erreur suppression', {
        professionalId,
        error: deleteError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    logger.info('API /admin/professionals/[id] DELETE - Succès', {
      professionalId,
      email: targetProfile.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('API /admin/professionals/[id] DELETE - Exception', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
