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

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { ShowStatus } from '@/types/database';

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

interface AssignmentsResponse {
  success: boolean;
  data?: AssignedShow[];
  error?: string;
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
): Promise<NextResponse<AssignmentsResponse>> {
  try {
    const { userId } = await context.params;

    logger.info('API /admin/users/[userId]/assignments GET', { userId });

    // 1. Authentification
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Autorisation : super-admin ou admin uniquement
    const { data: callerRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .in('role', ['super-admin', 'admin'])
      .maybeSingle();

    if (!callerRole) {
      logger.warn('API assignments GET - Droits insuffisants', { callerId: currentUser.id });
      return NextResponse.json({ success: false, error: 'Droits insuffisants' }, { status: 403 });
    }

    // 3. Validation UUID
    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Identifiant utilisateur invalide' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 4. Vérifier que la cible est bien un externe actif
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
      return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur externe non trouvé' },
        { status: 404 }
      );
    }

    // 5. Récupérer tous les slots où cet externe est hosted_by_id
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
      return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }

    if (!slots || slots.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 6. Récupérer les spectacles concernés (dédupliqués)
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
      return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }

    // 7. Agréger par spectacle : compter les slots et trouver la prochaine date
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

    // 8. Trier alphabétiquement par titre
    const assignedShows: AssignedShow[] = Array.from(showMap.values()).sort((a, b) =>
      a.show_title.localeCompare(b.show_title, 'fr')
    );

    logger.info('API assignments GET - Succès', {
      userId,
      showCount: assignedShows.length,
    });

    return NextResponse.json({ success: true, data: assignedShows });
  } catch (error) {
    logger.error('API assignments GET - Exception', { error });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
