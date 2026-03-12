import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRoleServer } from '@/lib/auth/get-user-role-server';
import { isSafeRedirectUrl, getRedirectUrlByRole } from '@/lib/auth/redirect-utils';
import { NEXT_PUBLIC_SUPABASE_URL } from '@/lib/env';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const type = requestUrl.searchParams.get('type');
    const next = requestUrl.searchParams.get('next');

    // Vérifier que le code existe
    if (!code) {
        return NextResponse.redirect(
            new URL('/login?error=auth_callback_error', requestUrl.origin)
        );
    }

    try {
        const supabase = await createClient();

        // Échanger le code contre une session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            logger.error('[Auth Callback] Erreur lors de l\'échange du code', error as Error);
            return NextResponse.redirect(
                new URL('/login?error=auth_callback_error', requestUrl.origin)
            );
        }

        // Vérifier le statut du compte (deleted_at, disabled_at)
        // Defense-in-depth : le middleware fait la même chose, mais ici on bloque immédiatement
        const userId = data.user?.id;
        if (userId) {
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (serviceRoleKey) {
                try {
                    const { createClient: createAdminSupabase } = await import(
                        '@supabase/supabase-js'
                    );
                    const adminClient = createAdminSupabase(
                        NEXT_PUBLIC_SUPABASE_URL,
                        serviceRoleKey,
                        { auth: { autoRefreshToken: false, persistSession: false } }
                    );
                    const { data: profile } = await adminClient
                        .from('profiles')
                        .select('disabled_at, deleted_at')
                        .eq('id', userId)
                        .maybeSingle();

                    if (profile?.deleted_at) {
                        await supabase.auth.signOut();
                        return NextResponse.redirect(
                            new URL('/login?error=account_deleted', requestUrl.origin)
                        );
                    }
                    if (profile?.disabled_at) {
                        await supabase.auth.signOut();
                        return NextResponse.redirect(
                            new URL('/login?error=account_disabled', requestUrl.origin)
                        );
                    }
                } catch (statusError) {
                    // Fail-open : le middleware prendra le relais
                    logger.warn(
                        '[Auth Callback] Vérification statut échouée, middleware prend le relais',
                        { error: String(statusError) }
                    );
                }
            }
        }

        // Déterminer la redirection
        let redirectUrl: string;

        if (type === 'recovery') {
            // Redirection vers la page de réinitialisation de mot de passe
            redirectUrl = '/reset-password';
        } else if (next && isSafeRedirectUrl(next)) {
            // Redirection vers l'URL demandée (si sécurisée)
            redirectUrl = next;
        } else {
            // Redirection selon le rôle de l'utilisateur
            if (userId) {
                const role = await getUserRoleServer(userId);
                redirectUrl = getRedirectUrlByRole(role);
            } else {
                // Fallback si pas d'userId (ne devrait pas arriver)
                redirectUrl = '/catalogue';
            }
        }

        return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
    } catch (error) {
        logger.error('[Auth Callback] Erreur inattendue', error as Error);
        return NextResponse.redirect(
            new URL('/login?error=auth_callback_error', requestUrl.origin)
        );
    }
}
