'use server';

export type AccountStatus = 'ok' | 'disabled' | 'deleted' | 'not_found';

export async function checkAccountStatus(
  userId: string,
  accessToken: string
): Promise<AccountStatus> {
  console.log('[checkAccountStatus] Appelé', { userId, hasToken: !!accessToken });

  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      console.error('[checkAccountStatus] Variables manquantes', { serviceRoleKey: !!serviceRoleKey, supabaseUrl: !!supabaseUrl });
      return 'ok';
    }

    // Import dynamique pour éviter les problèmes de module loading
    const { createClient } = await import('@supabase/supabase-js');

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Vérifier le token
    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken);
    console.log('[checkAccountStatus] getUser', { userId: user?.id, error: userError?.message });

    if (userError || !user || user.id !== userId) {
      return 'not_found';
    }

    // Lire le profil
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('disabled_at, deleted_at')
      .eq('id', userId)
      .maybeSingle();

    console.log('[checkAccountStatus] profile', {
      found: !!profile,
      deleted: !!profile?.deleted_at,
      disabled: !!profile?.disabled_at,
      error: profileError?.message,
    });

    if (profileError) return 'ok';
    if (!profile) return 'not_found';
    if (profile.deleted_at) return 'deleted';
    if (profile.disabled_at) return 'disabled';

    return 'ok';

  } catch (err) {
    console.error('[checkAccountStatus] Exception', err);
    return 'ok';
  }
}
