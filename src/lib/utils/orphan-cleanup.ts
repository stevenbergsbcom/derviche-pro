/**
 * Utilitaire partagé — Nettoyage des mappings orphelins
 * Derviche Diffusion — S185
 *
 * Quand un spectacle est soft-deleted (`deleted_at IS NOT NULL`), ses mappings
 * N-N (catégories, publics cibles) persistent.
 * Avant de supprimer une catégorie ou un public cible, on nettoie ces
 * mappings orphelins pour éviter les faux positifs « élément utilisé ».
 *
 * Factorisé depuis categories.ts et target-audiences.ts (logique identique).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

/**
 * Tables de mapping N-N supportées.
 */
type MappingTable = 'show_category_mapping' | 'show_target_audience_mapping';

/**
 * Colonne clé étrangère dans la table de mapping.
 */
type ForeignKeyColumn = 'category_id' | 'target_audience_id';

/**
 * Supprime les lignes de mapping liées à des spectacles soft-deleted.
 *
 * @param supabase    - Client Supabase
 * @param table       - Table de mapping à nettoyer
 * @param fkColumn    - Colonne clé étrangère (ex: `category_id`)
 * @param fkValue     - ID de l'entité (catégorie ou public cible)
 */
export async function cleanupOrphanMappings(
  supabase: SupabaseClient,
  table: MappingTable,
  fkColumn: ForeignKeyColumn,
  fkValue: string,
): Promise<void> {
  // Récupérer les show_ids des spectacles soft-deleted
  const { data: deletedShows } = await supabase
    .from('shows')
    .select('id')
    .not('deleted_at', 'is', null);

  if (!deletedShows || deletedShows.length === 0) return;

  const deletedShowIds = deletedShows.map((s) => s.id);

  // Supprimer les mappings orphelins pour cette entité
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from(table) as any).delete().eq(fkColumn, fkValue).in('show_id', deletedShowIds);

  logger.info(`Mappings orphelins nettoyés pour ${table}`, {
    [fkColumn]: fkValue,
    deletedShowIds,
  });
}
