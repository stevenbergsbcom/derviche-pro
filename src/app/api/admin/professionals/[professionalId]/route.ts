/**
 * API Route - Gestion d'un professionnel
 * PATCH /api/admin/professionals/[professionalId] - Mise à jour du profil complet
 * DELETE /api/admin/professionals/[professionalId] - Soft delete
 *
 * Accessible uniquement aux super-admin et admin.
 * Contrairement à /api/admin/users, cette route gère les champs
 * étendus du profil professionnel (structure, fonction, AFC, adresse, etc.)
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { logSystem } from '@/lib/services/logs';
import {
  requireAuth,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
  errorResponse,
} from '@/lib/api';

// ============================================
// TYPES
// ============================================

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
  /** Migration 118 — ID CRM Zoho */
  crm_id?: string | null;
}

// ============================================
// PATCH - Mise à jour profil complet
// ============================================

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { professionalId } = await context.params;
    logger.info('API /admin/professionals/[id] PATCH - Début', { professionalId });

    const supabase = await createClient();
    const auth = await requireAuth(supabase);
    if (!auth.ok) return auth.response;

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
      return notFoundResponse('Professionnel non trouvé');
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
      'crm_id',
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
      // S174 — surfacer le cas spécifique de l'ID CRM en doublon pour
      // donner une cause claire à l'admin (l'index unique partiel
      // `profiles_crm_id_unique` empêche d'attribuer le même ID à deux pros).
      if (updateError.message.includes('profiles_crm_id_unique')) {
        return errorResponse('Cet ID CRM est déjà attribué à un autre professionnel.');
      }
      return serverErrorResponse('Erreur lors de la mise à jour du profil');
    }

    logger.info('API /admin/professionals/[id] PATCH - Succès', {
      professionalId,
      email: targetProfile.email,
    });

    void logSystem('professional_update', 'info', {
      user_id: professionalId,
      email: targetProfile.email,
    }, auth.userId);

    return successResponse();
  } catch (error) {
    logger.error('API /admin/professionals/[id] PATCH - Exception', { error });
    return serverErrorResponse();
  }
}

// ============================================
// DELETE - Suppression (soft delete)
// ============================================

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { professionalId } = await context.params;
    logger.info('API /admin/professionals/[id] DELETE - Début', { professionalId });

    const supabase = await createClient();
    const auth = await requireAuth(supabase);
    if (!auth.ok) return auth.response;

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
      return notFoundResponse('Professionnel non trouvé');
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
      return serverErrorResponse('Erreur lors de la suppression');
    }

    logger.info('API /admin/professionals/[id] DELETE - Succès', {
      professionalId,
      email: targetProfile.email,
    });

    void logSystem('professional_delete', 'info', {
      user_id: professionalId,
      email: targetProfile.email,
    }, auth.userId);

    return successResponse();
  } catch (error) {
    logger.error('API /admin/professionals/[id] DELETE - Exception', { error });
    return serverErrorResponse();
  }
}
