'use server';

/**
 * Server Action - Vérification du statut d'un compte
 * Utilise le service role key pour bypasser les RLS (deleted_at IS NULL)
 * Appelée côté client après signInWithPassword avec l'access_token de la session
 */

import { logger } from '@/lib/logger';
import { NEXT_PUBLIC_SUPABASE_URL } from '@/lib/env';

export type AccountStatus = 'ok' | 'disabled' | 'deleted' | 'not_found';

export async function checkAccountStatus(
  userId: string,
  accessToken: string
): Promise<AccountStatus> {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      logger.error('[checkAccountStatus] SUPABASE_SERVICE_ROLE_KEY manquant');
      return 'ok'; // fail-open, le middleware prendra le relais
    }

    // Import dynamique pour éviter les problèmes de module loading
    const { createClient } = await import('@supabase/supabase-js');

    const adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Vérifier que le token appartient bien à cet userId
    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken);

    if (userError || !user || user.id !== userId) {
      logger.warn('[checkAccountStatus] Token invalide ou userId ne correspond pas');
      return 'not_found';
    }

    // Lire le profil (service role bypasse RLS deleted_at IS NULL)
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('disabled_at, deleted_at')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      logger.error('[checkAccountStatus] Erreur lecture profil', { error: profileError.message });
      return 'ok';
    }

    if (!profile) return 'not_found';
    if (profile.deleted_at) return 'deleted';
    if (profile.disabled_at) return 'disabled';

    return 'ok';

  } catch (err) {
    logger.error('[checkAccountStatus] Exception non gérée', { err });
    return 'ok'; // fail-open
  }
}
