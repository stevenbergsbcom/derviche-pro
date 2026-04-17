/**
 * POST /api/admin/shows/reorder
 * Derviche Diffusion — Migration 111 (Classement éditorial)
 *
 * Applique en un seul appel un ensemble d'updates partielles sur la table
 * `shows` (colonnes `display_order` et/ou `is_featured`). Utilisé par le
 * drag&drop de l'onglet /admin/preferences?tab=classement.
 *
 * Body attendu :
 *   {
 *     updates: Array<{
 *       id: string (uuid),
 *       display_order?: number | null,
 *       is_featured?: boolean,
 *     }>
 *   }
 *
 * Auth : ADMIN_ROLES (super-admin + admin).
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  requireAuth,
  errorResponse,
  serverErrorResponse,
  successResponse,
} from '@/lib/api';
import { logger } from '@/lib/logger';

// ============================================
// VALIDATION ZOD
// ============================================

// Format UUID accepté : regex souple (36 chars hex + tirets).
// Zod v4 `z.uuid()` valide strictement les variant bits (positions 19 doit être
// 8-b) — incompatible avec certains UUID existants en DB. Le type Postgres
// `uuid` garantit déjà le format côté base, donc on ne valide que la forme.
const UUID_LOOSE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const updateSchema = z
  .object({
    id: z.string().regex(UUID_LOOSE, 'ID de spectacle invalide'),
    display_order: z.number().int().min(0).nullable().optional(),
    is_featured: z.boolean().optional(),
  })
  .refine(
    (v) => v.display_order !== undefined || v.is_featured !== undefined,
    { message: 'Au moins un champ à mettre à jour (display_order ou is_featured)' },
  );

const bodySchema = z.object({
  updates: z.array(updateSchema).min(1).max(500),
});

// ============================================
// HANDLER
// ============================================

export async function POST(req: Request): Promise<Response> {
  const supabase = await createClient();
  const auth = await requireAuth(supabase, undefined, '[shows/reorder]');
  if (!auth.ok) return auth.response;

  // Parse body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return errorResponse('Body JSON invalide', 400);
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorResponse(
      `Body invalide : ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      400,
    );
  }

  const admin = createAdminClient();

  // Mutation par update unitaire — évite un `upsert` qui exigerait tous les
  // champs NOT NULL. Vu le volume max (500 lignes), le coût reste négligeable.
  let updatedCount = 0;
  for (const update of parsed.data.updates) {
    const { id, ...fields } = update;
    const { error } = await admin
      .from('shows')
      .update(fields)
      .eq('id', id)
      .is('deleted_at', null);

    if (error) {
      logger.error('[shows/reorder] Erreur update', { id, error: error.message });
      return serverErrorResponse(`Erreur lors de la mise à jour du show ${id}`);
    }
    updatedCount += 1;
  }

  logger.info('[shows/reorder] Mise à jour effectuée', {
    userId: auth.userId,
    updatedCount,
  });

  return successResponse({ updatedCount });
}
