import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Créer un client Supabase avec les cookies de la requête/réponse
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Rafraîchir la session (important pour Supabase)
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Routes publiques (accessibles sans authentification)
    const publicRoutes = [
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
    ];

    // Routes publiques avec préfixe (pour les sous-routes)
    const publicRoutePrefixes = ['/auth/callback'];

    // Vérifier si la route est publique
    const isExactPublicRoute = publicRoutes.includes(pathname);
    const isPublicRoutePrefix = publicRoutePrefixes.some((prefix) =>
        pathname.startsWith(prefix)
    );
    const isPublicRoute = isExactPublicRoute || isPublicRoutePrefix;

    // Routes d'authentification (login, register)
    const authRoutes = ['/login', '/register'];

    // Si l'utilisateur est connecté et accède à une route d'authentification
    if (user && authRoutes.includes(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    // Si l'utilisateur n'est pas connecté et accède à une route protégée
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        // Conserver l'URL de destination pour redirection après connexion
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

