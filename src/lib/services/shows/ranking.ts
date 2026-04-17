/**
 * Service Shows — Classement éditorial (migration 111)
 * Derviche Diffusion
 *
 * Charge la liste compacte des shows pour la page /admin/preferences?tab=classement
 * et centralise les mutations d'ordre / de vedette.
 *
 * Pattern `ApiResult<T>` comme le reste du service layer (`{ data, error }`).
 *
 * @module shows/ranking
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { ShowStatus } from '@/types/database';

// ============================================
// TYPES
// ============================================

/** Vue compacte d'un show pour le drag&drop classement. */
export interface ShowRanking {
  id: string;
  slug: string;
  title: string;
  status: ShowStatus;
  imageUrl: string | null;
  companyName: string;
  isFeatured: boolean;
  displayOrder: number | null;
}

export interface RankingListResult {
  data: ShowRanking[];
  error: string | null;
}

export interface RankingMutationResult {
  success: boolean;
  error?: string;
  data?: { updatedCount: number };
}

// ============================================
// QUERY
// ============================================

/**
 * Charge tous les shows non supprimés triés par display_order puis title.
 * Utilisé uniquement côté admin (rôles admin/super-admin via RLS).
 */
export async function fetchShowsForRanking(): Promise<RankingListResult> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('shows')
    .select(`
      id,
      slug,
      title,
      status,
      image_url,
      is_featured,
      display_order,
      companies!inner(name)
    `)
    .is('deleted_at', null)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  if (error) {
    logger.error('Erreur fetchShowsForRanking', error);
    return { data: [], error: error.message };
  }

  const rows = (data ?? []) as Array<{
    id: string;
    slug: string;
    title: string;
    status: string;
    image_url: string | null;
    is_featured?: boolean | null;
    display_order?: number | null;
    companies: { name: string } | null;
  }>;

  const shows: ShowRanking[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status as ShowStatus,
    imageUrl: row.image_url,
    companyName: row.companies?.name ?? 'Compagnie inconnue',
    isFeatured: row.is_featured ?? false,
    displayOrder: row.display_order ?? null,
  }));

  return { data: shows, error: null };
}

// ============================================
// MUTATIONS (via route API /api/admin/shows/reorder)
// ============================================

/**
 * Envoie un batch d'updates (display_order et/ou is_featured) en un seul appel.
 * Max 500 entrées par appel (validé côté route).
 */
export async function reorderShows(
  updates: Array<{
    id: string;
    display_order?: number | null;
    is_featured?: boolean;
  }>,
): Promise<RankingMutationResult> {
  if (updates.length === 0) {
    return { success: true, data: { updatedCount: 0 } };
  }

  try {
    const res = await fetch('/api/admin/shows/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });

    const json = (await res.json().catch(() => null)) as
      | { success: true; data?: { updatedCount: number } }
      | { success: false; error: string }
      | null;

    if (!res.ok || !json || json.success === false) {
      const message =
        (json && json.success === false && json.error) ||
        `Erreur HTTP ${res.status}`;
      logger.error('reorderShows échec', { status: res.status, message });
      return { success: false, error: message };
    }

    return { success: true, data: json.data ?? { updatedCount: updates.length } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    logger.error('reorderShows exception', { message });
    return { success: false, error: message };
  }
}

/** Toggle rapide `is_featured` pour un seul show (wrap reorderShows). */
export async function setShowFeatured(
  id: string,
  is_featured: boolean,
): Promise<RankingMutationResult> {
  return reorderShows([{ id, is_featured }]);
}

/** Mise à jour unitaire du rang (wrap reorderShows). */
export async function setShowDisplayOrder(
  id: string,
  display_order: number | null,
): Promise<RankingMutationResult> {
  return reorderShows([{ id, display_order }]);
}

/**
 * Réinitialise `display_order = NULL` sur tous les shows non supprimés.
 * Appel direct Supabase (admin seul autorisé via RLS).
 */
export async function resetGlobalOrder(): Promise<RankingMutationResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from('shows')
    .update({ display_order: null })
    // Contourne la limite "update without filter" de PostgREST en ciblant
    // explicitement tous les non supprimés.
    .is('deleted_at', null)
    .not('id', 'is', null);

  if (error) {
    logger.error('resetGlobalOrder échec', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: { updatedCount: count ?? 0 } };
}
