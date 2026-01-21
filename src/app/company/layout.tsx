'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CompanySidebar } from '@/components/company/company-sidebar';
import { Button } from '@/components/ui/button';
import { Menu, Loader2, AlertTriangle } from 'lucide-react';
import { useCurrentUserRole } from '@/hooks';
import { logger } from '@/lib/logger';

// ============================================
// COMPOSANT ERREUR D'ACCÈS
// ============================================

function AccessDenied({ message }: { message: string }) {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted">
            <div className="text-center space-y-4 p-8 bg-white rounded-lg shadow-lg max-w-md">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <h1 className="text-xl font-bold text-derviche-dark">Accès refusé</h1>
                <p className="text-muted-foreground">{message}</p>
                <Button onClick={() => router.push('/')} variant="outline">
                    Retour à l&apos;accueil
                </Button>
            </div>
        </div>
    );
}

// ============================================
// COMPOSANT CHARGEMENT
// ============================================

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted">
            <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-gold mx-auto" />
                <p className="text-muted-foreground">Chargement de votre espace...</p>
            </div>
        </div>
    );
}

// ============================================
// LAYOUT PRINCIPAL
// ============================================

export default function CompanyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const { role, isLoading, isAuthenticated, hasRoleFetchError } = useCurrentUserRole();
    const router = useRouter();

    // Vérification de l'accès côté client (double sécurité avec middleware)
    useEffect(() => {
        // Attendre la fin du chargement
        if (isLoading) return;

        // Non authentifié → redirection vers login (normalement géré par middleware)
        if (!isAuthenticated) {
            logger.warn('Accès company layout sans authentification');
            router.push('/login?next=/company');
            return;
        }

        // Erreur de récupération du rôle → fail-secure
        if (hasRoleFetchError) {
            logger.error('Erreur récupération rôle dans company layout');
            return; // Afficher l'erreur
        }

        // Rôle incorrect → refuser l'accès (normalement géré par middleware)
        if (role !== 'company') {
            logger.warn('Accès company layout avec mauvais rôle', { role });
            return; // Afficher l'erreur
        }
    }, [isLoading, isAuthenticated, role, hasRoleFetchError, router]);

    // Affichage pendant le chargement
    if (isLoading) {
        return <LoadingScreen />;
    }

    // Non authentifié
    if (!isAuthenticated) {
        return <AccessDenied message="Vous devez être connecté pour accéder à cet espace." />;
    }

    // Erreur de récupération du rôle (fail-secure)
    if (hasRoleFetchError) {
        return (
            <AccessDenied message="Une erreur est survenue lors de la vérification de vos droits d'accès. Veuillez réessayer." />
        );
    }

    // Mauvais rôle
    if (role !== 'company') {
        return (
            <AccessDenied message="Cet espace est réservé aux compagnies artistiques. Votre compte ne dispose pas des autorisations nécessaires." />
        );
    }

    // Accès autorisé → afficher l'interface
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <CompanySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Contenu principal */}
            <main className="flex-1 lg:ml-[260px] bg-muted min-h-screen overflow-x-hidden">
                {/* Header mobile avec bouton hamburger */}
                <div className="lg:hidden sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                        className="h-9 w-9"
                    >
                        <Menu className="w-5 h-5" />
                        <span className="sr-only">Ouvrir le menu</span>
                    </Button>
                    <h1 className="text-lg font-semibold text-derviche-dark">Espace Compagnie</h1>
                </div>

                {/* Contenu */}
                <div className="p-4 lg:p-8 max-w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
