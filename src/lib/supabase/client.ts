import { createBrowserClient } from '@supabase/ssr';
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from '@/lib/env';

// Singleton pour éviter de recréer le client à chaque appel
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (!supabaseClient) {
        supabaseClient = createBrowserClient(
            NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
    }
    return supabaseClient;
}
