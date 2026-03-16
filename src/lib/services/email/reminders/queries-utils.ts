/**
 * Queries Utils — Service Rappels Email
 * Derviche Diffusion
 *
 * Client Supabase service role partagé entre les sous-modules queries.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// CLIENT SERVICE ROLE (bypass RLS)
// ============================================

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('[reminders/queries] Variables NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
