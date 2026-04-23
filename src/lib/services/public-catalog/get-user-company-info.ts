/**
 * Service : getUserCompanyInfo
 * Derviche Diffusion
 *
 * Récupère `{ id, name }` de la compagnie associée à l'utilisateur connecté
 * (via `profiles.company_id`). Utilisé côté catalogue public pour afficher
 * le bandeau info quand un user `company` démarre une réservation — cf.
 * migration 113 (réservation forcée en mode guest pour le compte compagnie).
 *
 * Retourne `null` si l'utilisateur n'est pas connecté ou n'a pas de compagnie
 * liée. N'interprète pas le rôle — c'est à l'appelant d'avoir déjà vérifié
 * `isCompanyRole` via `useCurrentUserRole`.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export interface UserCompanyInfo {
  id: string;
  name: string;
}

/** Retourne la compagnie liée au user connecté, ou `null`. */
export async function getUserCompanyInfo(
  userId: string,
): Promise<{ data: UserCompanyInfo | null; error: string | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('company:company_id (id, name)')
      .eq('id', userId)
      .single();

    if (error) {
      logger.warn('[getUserCompanyInfo] Erreur lecture profile', {
        userId,
        error: error.message,
      });
      return { data: null, error: error.message };
    }

    // `company` peut être null (utilisateur sans compagnie) — c'est normal.
    // Supabase peut typer `company` en tableau selon la relation ; on gère
    // les deux cas pour rester robuste.
    const company = Array.isArray(data?.company) ? data?.company[0] : data?.company;
    if (!company || !company.id || !company.name) {
      return { data: null, error: null };
    }

    return { data: { id: company.id, name: company.name }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[getUserCompanyInfo] Exception', { message });
    return { data: null, error: message };
  }
}
