/**
 * Client Supabase Admin (Service Role)
 * Derviche Diffusion
 * 
 * ⚠️ ATTENTION : Ce client a des privilèges admin complets.
 * - N'utiliser QUE côté serveur (API Routes, Server Actions)
 * - JAMAIS importer côté client
 * - Permet de bypasser les RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import { NEXT_PUBLIC_SUPABASE_URL, getServerEnv } from '@/lib/env';

/**
 * Crée un client Supabase avec les privilèges admin (service_role)
 * 
 * @example
 * ```ts
 * // Dans une API Route
 * import { createAdminClient } from '@/lib/supabase/server-admin';
 * 
 * export async function POST(request: Request) {
 *   const supabaseAdmin = createAdminClient();
 *   
 *   // Créer un utilisateur
 *   const { data, error } = await supabaseAdmin.auth.admin.createUser({
 *     email: 'user@example.com',
 *     password: 'password123',
 *   });
 * }
 * ```
 */
export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();

  return createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        // Désactiver la persistance de session (pas nécessaire côté serveur)
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
