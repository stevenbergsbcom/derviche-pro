/**
 * Wrapper RPC typé — Supabase
 * Derviche Diffusion — S185
 *
 * Appelle une fonction RPC PostgreSQL custom sans recourir à `as any`.
 * Les RPC ajoutées par migration ne sont pas dans les types auto-générés
 * (`Database['public']['Functions']`), ce qui force habituellement un cast.
 *
 * Ce helper contourne le problème en utilisant `.rpc()` via un cast
 * unique et centralisé, documenté et contrôlé.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PostgrestError } from '@supabase/postgrest-js';

/**
 * Appelle une fonction RPC Supabase dont le nom n'est pas (encore)
 * dans les types auto-générés.
 *
 * @param supabase - Client Supabase (browser ou server)
 * @param fnName   - Nom de la fonction PostgreSQL
 * @param params   - Paramètres de la fonction (objet clé/valeur)
 * @returns        - `{ data, error }` typé selon TResult
 *
 * @example
 * ```ts
 * const { data, error } = await callRpc<UpdateRpcParams, UpdateRpcResult>(
 *   supabase,
 *   'update_reservation_safe',
 *   { p_reservation_id: id, p_first_name: 'Marie' },
 * );
 * ```
 */
export async function callRpc<
  TParams extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown,
>(
  supabase: SupabaseClient,
  fnName: string,
  params: TParams,
): Promise<{ data: TResult | null; error: PostgrestError | null }> {
  // Cast unique et centralisé : les RPC custom ne sont pas déclarées
  // dans Database['public']['Functions'], d'où le cast sur .rpc.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(fnName, params);
  return { data: data as TResult | null, error };
}
