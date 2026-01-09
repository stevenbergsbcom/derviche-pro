import { createBrowserClient } from '@supabase/ssr';
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from '@/lib/env';
import type { Database } from '@/types/database';

// Singleton pour éviter de recréer le client à chaque appel
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Crée un client Supabase typé pour le navigateur
 * Utilise un singleton pour éviter les instances multiples
 */
export function createClient() {
    if (!supabaseClient) {
        supabaseClient = createBrowserClient<Database>(
            NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
    }
    return supabaseClient;
}
