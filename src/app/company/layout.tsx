'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CompanySidebar } from '@/components/company/company-sidebar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { LoadingScreen, AccessDenied } from '@/components/shared';
import { useCurrentUserRole } from '@/hooks';
import { logger } from '@/lib/logger';

// ============================================
// LAYOUT PRINCIPAL
// ============================================

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isLoading, isAuthenticated, hasRoleFetchError } =
    useCurrentUserRole();
  const router = useRouter();

  // Filet de secours : si la navigation SPA ne se déclenche pas dans les 4s,
  // on passe redirectTimeout à true pour afficher un lien manuel vers /login
  const [redirectTimeout, setRedirectTimeout] = useState(false);

  // Vérification de l'accès côté client (double sécurité avec middleware)
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      logger.warn('Accès company layout sans authentification');
      router.push('/login?next=/company');

      const timer = setTimeout(() => {
        setRedirectTimeout(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    if (hasRoleFetchError) {
      logger.error('Erreur récupération rôle dans company layout');
      return;
    }

    if (role !== 'company') {
      logger.warn('Accès company layout avec mauvais rôle', { role });
      return;
    }
  }, [isLoading, isAuthenticated, role, hasRoleFetchError, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Non authentifié → redirection en cours vers /login (useEffect)
  // On affiche LoadingScreen pour éviter le flash "Accès refusé" pendant la navigation.
  // Si la navigation SPA échoue, le timeout affiche un lien de secours.
  if (!isAuthenticated) {
    if (redirectTimeout) {
      return (
        <AccessDenied
          title="Redirection en cours…"
          message="La redirection automatique n'a pas fonctionné."
          returnUrl="/login"
          returnLabel="Aller à la page de connexion"
        />
      );
    }
    return <LoadingScreen />;
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
    <SidebarProvider>
      {/* Sidebar */}
      <CompanySidebar />

      {/* Contenu principal */}
      <SidebarInset>
        {/* Header avec trigger sidebar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <SidebarTrigger className="-ml-1" aria-label="Ouvrir/fermer le menu" />
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-semibold text-derviche-dark lg:hidden">
            Espace Compagnie
          </h1>
        </header>

        {/* Contenu */}
        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
