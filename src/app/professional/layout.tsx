'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  // Vérification de l'accès côté client (double sécurité avec middleware)
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      logger.warn('Accès professional layout sans authentification');
      router.push('/login?next=/professional');
      return;
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

  if (!isAuthenticated) {
    return (
      <AccessDenied message="Vous devez être connecté pour accéder à cet espace." />
    );
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
            Espace Professionnel
          </h1>
        </header>

        {/* Contenu */}
        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
