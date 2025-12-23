import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRoleServer, getRedirectUrlByRole } from '@/lib/auth/get-user-role-server';
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

        // Déterminer la redirection
        let redirectUrl: string;

        if (type === 'recovery') {
            // Redirection vers la page de réinitialisation de mot de passe
            redirectUrl = '/reset-password';
        } else if (next) {
            // Valider que "next" commence par "/" pour éviter les open redirects
            if (next.startsWith('/')) {
                redirectUrl = next;
            } else {
                // Si "next" ne commence pas par "/", rediriger selon le rôle
                const userId = data.user?.id;
                if (userId) {
                    const role = await getUserRoleServer(userId);
                    redirectUrl = getRedirectUrlByRole(role);
                } else {
                    redirectUrl = '/dashboard';
                }
            }
        } else {
            // Redirection selon le rôle de l'utilisateur
            const userId = data.user?.id;
            if (userId) {
                const role = await getUserRoleServer(userId);
                redirectUrl = getRedirectUrlByRole(role);
            } else {
                redirectUrl = '/dashboard';
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
