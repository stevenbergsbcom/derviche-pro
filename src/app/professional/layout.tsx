'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ProfessionalSidebar } from '@/components/professional';
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
// HELPER — titre de page mobile selon la route
// ============================================

function getMobilePageTitle(pathname: string): string {
  if (pathname === '/professional') return 'Tableau de bord';
  if (pathname.startsWith('/professional/reservations')) return 'Mes réservations';
  if (pathname.startsWith('/professional/mon-compte')) return 'Mon compte';
  return 'Espace Professionnel';
}

// ============================================
// LAYOUT PRINCIPAL
// ============================================

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isLoading, isAuthenticated, hasRoleFetchError } =
    useCurrentUserRole();
  const router = useRouter();
  const pathname = usePathname();

  // Filet de secours : si la navigation SPA ne se déclenche pas dans les 4s,
  // on passe redirectTimeout à true pour afficher un lien manuel vers /login
  const [redirectTimeout, setRedirectTimeout] = useState(false);

  // Vérification de l'accès côté client (double sécurité avec middleware)
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      logger.warn('Accès professional layout sans authentification');
      router.push('/login?next=/professional');

      const timer = setTimeout(() => {
        setRedirectTimeout(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    if (hasRoleFetchError) {
      logger.error('Erreur récupération rôle dans professional layout');
      return;
    }

    if (role !== 'professional') {
      logger.warn('Accès professional layout avec mauvais rôle', { role });
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

  if (hasRoleFetchError) {
    return (
      <AccessDenied message="Une erreur est survenue lors de la vérification de vos droits d'accès. Veuillez réessayer." />
    );
  }

  if (role !== 'professional') {
    return (
      <AccessDenied message="Cet espace est réservé aux programmateurs professionnels. Votre compte ne dispose pas des autorisations nécessaires." />
    );
  }

  return (
    <SidebarProvider>
      {/* Sidebar */}
      <ProfessionalSidebar />

      {/* Contenu principal */}
      <SidebarInset>
        {/* Header avec trigger sidebar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <SidebarTrigger className="-ml-1" aria-label="Ouvrir/fermer le menu" />
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-semibold text-derviche-dark lg:hidden">
            {getMobilePageTitle(pathname)}
          </h1>
        </header>

        {/* Contenu */}
        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
