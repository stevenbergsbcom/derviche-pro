/**
 * API Route - Spectacles assignés à un externe (via hosted_by_id)
 * GET /api/admin/users/[userId]/assignments
 *
 * Retourne la liste des spectacles sur lesquels l'externe est
 * désigné comme personne d'accueil (slots.hosted_by_id = userId).
 *
 * Note : la table slots utilise date (YYYY-MM-DD) + time (HH:MM:SS) séparés,
 *        pas un champ start_time combiné.
 *
 * Accès : super-admin + admin uniquement
 * Cible : uniquement les utilisateurs avec rôle 'externe'
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { ShowStatus } from '@/types/database';
import {
  requireAuth,
  errorResponse,
  notFoundResponse,
  successResponse,
  serverErrorResponse,
} from '@/lib/api';

// ============================================
// TYPES
// ============================================

export interface AssignedShow {
  show_id: string;
  show_title: string;
  show_status: ShowStatus;
  slot_count: number;
  /** Prochaine date dans le futur, format ISO "YYYY-MM-DD" ou null */
  next_slot_date: string | null;
}

interface RouteContext {
  params: Promise<{ userId: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// GET — Liste des spectacles assignés
// ============================================

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { userId } = await context.params;

    logger.info('API /admin/users/[userId]/assignments GET', { userId });

    // 1. Authentification + autorisation
    const supabase = await createClient();
    const auth = await requireAuth(supabase, undefined, 'API assignments GET');
    if (!auth.ok) return auth.response;

    // 2. Validation UUID
    if (!UUID_REGEX.test(userId)) {
      return errorResponse('Identifiant utilisateur invalide', 400);
    }

    const supabaseAdmin = createAdminClient();

    // 3. Vérifier que la cible est bien un externe actif
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        user_roles!inner (role)
      `)
      .eq('id', userId)
      .is('deleted_at', null)
      .eq('user_roles.role', 'externe')
      .maybeSingle();

    if (targetError) {
      logger.error('API assignments GET - Erreur vérification', {
        userId,
        error: targetError.message,
      });
      return serverErrorResponse();
    }

    if (!targetUser) {
      return notFoundResponse('Utilisateur externe non trouvé');
    }

    // 4. Récupérer tous les slots où cet externe est hosted_by_id
    //    On récupère date + time séparément (structure réelle de la table)
    const { data: slots, error: slotsError } = await supabaseAdmin
      .from('slots')
      .select('id, show_id, date, time')
      .eq('hosted_by_id', userId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (slotsError) {
      logger.error('API assignments GET - Erreur slots', {
        userId,
        error: slotsError.message,
      });
      return serverErrorResponse();
    }

    if (!slots || slots.length === 0) {
      return successResponse([]);
    }

    // 5. Récupérer les spectacles concernés (dédupliqués)
    const showIds = [...new Set(slots.map((s) => s.show_id).filter(Boolean))] as string[];

    const { data: shows, error: showsError } = await supabaseAdmin
      .from('shows')
      .select('id, title, status')
      .in('id', showIds)
      .is('deleted_at', null);

    if (showsError) {
      logger.error('API assignments GET - Erreur shows', {
        userId,
        error: showsError.message,
      });
      return serverErrorResponse();
    }

    // 6. Agréger par spectacle : compter les slots et trouver la prochaine date
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const showMap = new Map<string, AssignedShow>();

    // Initialiser avec les shows récupérés
    for (const show of shows ?? []) {
      showMap.set(show.id, {
        show_id: show.id,
        show_title: show.title,
        show_status: show.status as ShowStatus,
        slot_count: 0,
        next_slot_date: null,
      });
    }

    // Parcourir les slots (déjà triés par date ASC) pour agréger
    for (const slot of slots) {
      if (!slot.show_id) continue;
      const entry = showMap.get(slot.show_id);
      if (!entry) continue;

      entry.slot_count += 1;

      // Chercher la prochaine date future (date >= aujourd'hui)
      if (slot.date && slot.date >= todayStr && entry.next_slot_date === null) {
        entry.next_slot_date = slot.date;
      }
    }

    // 7. Trier alphabétiquement par titre
    const assignedShows: AssignedShow[] = Array.from(showMap.values()).sort((a, b) =>
      a.show_title.localeCompare(b.show_title, 'fr')
    );

    logger.info('API assignments GET - Succès', {
      userId,
      showCount: assignedShows.length,
    });

    return successResponse(assignedShows);
  } catch (error) {
    logger.error('API assignments GET - Exception', { error });
    return serverErrorResponse();
  }
}
