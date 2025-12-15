import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('[Auth Callback] Error exchanging code:', error);
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
                // Si "next" ne commence pas par "/", utiliser la valeur par défaut
                redirectUrl = '/dashboard';
            }
        } else {
            // Redirection par défaut
            redirectUrl = '/dashboard';
        }

        return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
    } catch (error) {
        console.error('[Auth Callback] Unexpected error:', error);
        return NextResponse.redirect(
            new URL('/login?error=auth_callback_error', requestUrl.origin)
        );
    }
}

