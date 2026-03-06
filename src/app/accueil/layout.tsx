/**
 * Layout Accueil - Interface de check-in mobile
 * Derviche Diffusion
 * 
 * Rôles autorisés : super-admin, admin, externe, company
 * Interface minimaliste mobile-first pour l'accueil sur place
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ChevronLeft, LogOut, Home } from 'lucide-react';
import { useCurrentUserRole, type UserRole } from '@/hooks/useCurrentUserRole';
import { ReservationFAB } from '@/components/accueil/ReservationFAB';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

// ============================================
// CONSTANTES
// ============================================

/** Rôles autorisés pour l'interface d'accueil */
const ALLOWED_ROLES: UserRole[] = ['super-admin', 'admin', 'externe', 'company'];

/** Labels des rôles pour l'affichage */
const ROLE_LABELS: Record<string, string> = {
  'super-admin': 'Super Admin',
  'admin': 'Admin',
  'externe': 'Externe',
  'company': 'Compagnie',
};

// ============================================
// COMPOSANT ERREUR D'ACCÈS
// ============================================

function AccessDenied({ message }: { message: string }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-derviche/5 to-white p-4">
      <div className="text-center space-y-4 p-6 bg-white rounded-xl shadow-lg max-w-sm w-full">
        <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-derviche-dark">Accès refusé</h1>
        <p className="text-base text-muted-foreground">{message}</p>
        <Button onClick={() => router.push('/')} variant="outline" className="w-full">
          <Home className="w-4 h-4 mr-2" />
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-derviche/5 to-white">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-gold mx-auto" />
        <p className="text-base text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}

// ============================================
// COMPOSANT HEADER
// ============================================

interface AccueilHeaderProps {
  role: UserRole;
  showBackButton?: boolean;
}

function AccueilHeader({ role, showBackButton }: AccueilHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Afficher le bouton retour si on n'est pas sur la page principale
  const isMainPage = pathname === '/accueil';
  const displayBackButton = showBackButton ?? !isMainPage;

  /**
   * Navigation retour déterministe — évite router.back() qui est non fiable
   * en PWA standalone (pile d'historique vide au lancement)
   *
   * /accueil/[showSlug]/[slotId] → /accueil/[showSlug]
   * /accueil/[showSlug]          → /accueil
   * autre                        → /accueil (fallback)
   */
  const handleBack = () => {
    const segments = pathname.split('/').filter(Boolean);
    // ['accueil', showSlug, slotId] → /accueil/showSlug
    // ['accueil', showSlug]         → /accueil
    if (segments.length >= 3) {
      router.push(`/${segments.slice(0, 2).join('/')}`);
    } else if (segments.length === 2) {
      router.push('/accueil');
    } else {
      router.push('/accueil');
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie');
      router.push('/login');
    } catch (error) {
      logger.error('Erreur déconnexion', { error });
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-derviche text-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Gauche : Retour ou Logo */}
        <div className="flex items-center gap-2">
          {displayBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="sr-only">Retour</span>
            </Button>
          ) : (
            <Link href="/accueil" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center font-bold text-derviche">
                D
              </div>
            </Link>
          )}
          <div>
            <h1 className="font-semibold text-base">Accueil</h1>
            {role && (
              <p className="text-sm text-white/70">{ROLE_LABELS[role] || role}</p>
            )}
          </div>
        </div>

        {/* Droite : Déconnexion */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-9 w-9 text-white hover:bg-white/10"
        >
          <LogOut className="w-5 h-5" />
          <span className="sr-only">Déconnexion</span>
        </Button>
      </div>
    </header>
  );
}

// ============================================
// LAYOUT PRINCIPAL
// ============================================

export default function AccueilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isLoading, isAuthenticated, hasRoleFetchError } = useCurrentUserRole();
  const router = useRouter();

  // Vérification de l'accès
  useEffect(() => {
    if (isLoading) return;

    // Non authentifié → redirection vers login
    if (!isAuthenticated) {
      logger.warn('Accès accueil layout sans authentification');
      router.push('/login?next=/accueil');
      return;
    }

    // Erreur de récupération du rôle → fail-secure
    if (hasRoleFetchError) {
      logger.error('Erreur récupération rôle dans accueil layout');
      return;
    }

    // Rôle non autorisé
    if (!role || !ALLOWED_ROLES.includes(role)) {
      logger.warn('Accès accueil layout avec rôle non autorisé', { role });
      return;
    }
  }, [isLoading, isAuthenticated, role, hasRoleFetchError, router]);

  // Chargement ou déconnexion en cours
  // Note: On affiche LoadingScreen au lieu de AccessDenied pour éviter un flash
  // lors de la déconnexion (le useEffect redirige vers /login)
  if (isLoading || !isAuthenticated) {
    return <LoadingScreen />;
  }

  // Erreur de récupération du rôle
  if (hasRoleFetchError) {
    return (
      <AccessDenied message="Une erreur est survenue lors de la vérification de vos droits. Veuillez réessayer." />
    );
  }

  // Rôle non autorisé
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return (
      <AccessDenied message="Cette interface est réservée au personnel d'accueil (Admin, Externe ou Compagnie)." />
    );
  }

  // Accès autorisé
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AccueilHeader role={role} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <ReservationFAB />
    </div>
  );
}
