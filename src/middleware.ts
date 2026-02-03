import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from '@/lib/env';
import type { UserRole } from '@/types/database';
import { isSafeRedirectUrl, getRedirectUrlByRole } from '@/lib/auth/redirect-utils';

// ============================================
// CONSTANTS
// ============================================

// Rôles autorisés pour l'interface admin
const ADMIN_ROLES: UserRole[] = ['super-admin', 'admin', 'externe'];

// Rôles avec accès admin complet (tous les menus)
const FULL_ADMIN_ROLES: UserRole[] = ['super-admin', 'admin'];

// Routes admin réservées aux rôles avec accès complet (interdites aux externes)
const RESTRICTED_ADMIN_ROUTES: string[] = [
    '/admin/lieux',
    '/admin/compagnies',
    '/admin/utilisateurs',
    '/admin/preferences',
];

// Rôles autorisés pour l'interface compagnie
const COMPANY_ROLES: UserRole[] = ['company'];

// Rôles autorisés pour l'interface check-in (accueil)
const ACCUEIL_ROLES: UserRole[] = ['super-admin', 'admin', 'externe', 'company'];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Vérifie si un chemin correspond à une route restreinte
 * Gère les sous-routes (ex: /admin/lieux/123)
 */
function isRestrictedAdminRoute(pathname: string): boolean {
    return RESTRICTED_ADMIN_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + '/')
    );
}

// ============================================
// MIDDLEWARE
// ============================================

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Créer un client Supabase avec les cookies de la requête/réponse
    const supabase = createServerClient(
        NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
    // D'abord getSession pour rafraîchir les cookies, puis getUser pour valider
    await supabase.auth.getSession();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname, searchParams } = request.nextUrl;

    // Vérifier si l'utilisateur est désactivé
    if (user) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('disabled_at')
            .eq('id', user.id)
            .single();

        // Si erreur lors de la récupération du profil ou compte désactivé, déconnecter
        if (profileError || profile?.disabled_at) {
            await supabase.auth.signOut();
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('error', profileError ? 'profile_error' : 'account_disabled');
            return NextResponse.redirect(url);
        }
    }

    // Routes publiques (accessibles sans authentification)
    const publicRoutes = [
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
    ];

    // Routes publiques avec préfixe (pour les sous-routes)
    const publicRoutePrefixes = [
        '/auth/callback',
        // Routes publiques
        '/catalogue',
        '/spectacle',
        // Routes de redirection (legacy)
        '/pro-dashboard',
        '/admin-dashboard',
    ];

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
        
        // 1. Vérifier si ?next= existe et est sécurisé
        const nextUrl = searchParams.get('next');
        if (nextUrl && isSafeRedirectUrl(nextUrl)) {
            url.pathname = nextUrl;
            url.searchParams.delete('next');
            return NextResponse.redirect(url);
        }
        
        // 2. Sinon, récupérer le rôle et rediriger vers la destination par défaut
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();
        
        const userRole = roleData?.role as UserRole | null;
        url.pathname = getRedirectUrlByRole(userRole);
        url.searchParams.delete('next');
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

    // ============================================
    // PROTECTION PAR RÔLE
    // ============================================

    // Routes nécessitant une vérification de rôle
    const isAdminRoute = pathname.startsWith('/admin');
    const isCompanyRoute = pathname.startsWith('/company');
    const isAccueilRoute = pathname.startsWith('/accueil');

    // Si c'est une route protégée par rôle et que l'utilisateur est connecté
    if (user && (isAdminRoute || isCompanyRoute || isAccueilRoute)) {
        // Récupérer le rôle de l'utilisateur
        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        // SÉCURITÉ (fail-secure) : Si erreur lors de la récupération du rôle, bloquer l'accès
        if (roleError || !roleData) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('error', 'role_not_found');
            return NextResponse.redirect(url);
        }

        const userRole = roleData.role as UserRole;

        // Vérification pour les routes /admin/*
        if (isAdminRoute) {
            // Vérifier si l'utilisateur a un rôle admin (super-admin, admin, externe)
            if (!ADMIN_ROLES.includes(userRole)) {
                const url = request.nextUrl.clone();
                url.pathname = '/';
                url.searchParams.set('error', 'unauthorized');
                return NextResponse.redirect(url);
            }

            // Vérification supplémentaire pour les routes restreintes (externes interdits)
            if (isRestrictedAdminRoute(pathname) && !FULL_ADMIN_ROLES.includes(userRole)) {
                const url = request.nextUrl.clone();
                url.pathname = '/admin'; // Rediriger vers le dashboard admin
                url.searchParams.set('error', 'restricted_route');
                return NextResponse.redirect(url);
            }
        }

        // Vérification pour les routes /company/*
        if (isCompanyRoute && !COMPANY_ROLES.includes(userRole)) {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            url.searchParams.set('error', 'unauthorized');
            return NextResponse.redirect(url);
        }

        // Vérification pour les routes /accueil/* (check-in)
        if (isAccueilRoute && !ACCUEIL_ROLES.includes(userRole)) {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            url.searchParams.set('error', 'unauthorized');
            return NextResponse.redirect(url);
        }
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
         * - sw.js (service worker)
         * - public folder files (static assets)
         */
        '/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|ico)$).*)',
    ],
};
