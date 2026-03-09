'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/logout-button';
import { Menu, X, User, CalendarDays } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { UserRole } from '@/types/database';

/**
 * Retourne l'URL de "Mon compte" selon le rôle
 */
function getAccountUrl(role: UserRole | null): string {
  switch (role) {
    case 'super-admin':
    case 'admin':
    case 'externe':
      return '/admin/mon-compte';
    case 'company':
      return '/company/mon-compte';
    case 'professional':
      return '/professional/mon-compte';
    default:
      return '/login';
  }
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour charger le rôle utilisateur
  const loadUserRole = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (roles && roles.length > 0) {
        // Priorité des rôles
        const rolePriority: UserRole[] = ['super-admin', 'admin', 'externe', 'company', 'professional'];
        const userRoles = roles.map(r => r.role as UserRole);
        
        for (const role of rolePriority) {
          if (userRoles.includes(role)) {
            setUserRole(role);
            return;
          }
        }
      }
      setUserRole(null);
    } catch {
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Récupérer la session initiale
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        await loadUserRole(session.user.id);
      }
      
      setIsLoading(false);
    };

    void initSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session: Session | null) => {
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          // Charger le rôle en arrière-plan (ne pas bloquer)
          void loadUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserRole]);

  const accountUrl = getAccountUrl(userRole);

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + Navigation Desktop */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logos/logo-derviche-bleu.png"
              alt="Derviche Diffusion"
              width={180}
              height={70}
              className="h-12 md:h-16 w-auto"
              priority
            />
          </Link>

          {/* Navigation Desktop - À gauche, en bleu clair */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/catalogue"
              className="text-lg font-medium text-muted-foreground hover:text-derviche transition"
            >
              Catalogue
            </Link>
            <Link
              href="#contact"
              className="text-lg font-medium text-muted-foreground hover:text-derviche transition"
            >
              Contact
            </Link>
          </nav>
        </div>

        {/* Auth buttons Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {isLoading ? (
            // Placeholder pendant le chargement pour éviter le flash
            <div className="w-32 h-10" />
          ) : user ? (
            // Utilisateur connecté
            <>
              {userRole === 'professional' && (
                <Link
                  href="/professional/reservations"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-derviche transition"
                >
                  <CalendarDays className="w-4 h-4" />
                  Mes réservations
                </Link>
              )}
              <Link
                href={accountUrl}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-derviche transition"
              >
                <User className="w-4 h-4" />
                Mon compte
              </Link>
              <LogoutButton variant="outline" className="text-base" />
            </>
          ) : (
            // Utilisateur non connecté
            <>
              <Button variant="ghost" className="text-lg" asChild>
                <Link href="/login">Connexion</Link>
              </Button>
              <Button className="text-lg bg-derviche hover:bg-derviche-dark" asChild>
                <Link href="/register">Inscription</Link>
              </Button>
            </>
          )}
        </div>

        {/* Menu Burger Mobile */}
        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 flex flex-col items-center gap-4">
            <Link
              href="/catalogue"
              className="text-lg font-medium py-2 text-muted-foreground hover:text-derviche transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Catalogue
            </Link>
            <Link
              href="#contact"
              className="text-lg font-medium py-2 text-muted-foreground hover:text-derviche transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <hr className="my-2 w-full" />

            {isLoading ? (
              // Placeholder pendant le chargement
              <div className="w-32 h-10" />
            ) : user ? (
              // Utilisateur connecté - Mobile
              <>
                {userRole === 'professional' && (
                  <Link
                    href="/professional/reservations"
                    className="flex items-center gap-2 text-lg font-medium py-2 text-muted-foreground hover:text-derviche transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <CalendarDays className="w-5 h-5" />
                    Mes réservations
                  </Link>
                )}
                <Link
                  href={accountUrl}
                  className="flex items-center gap-2 text-lg font-medium py-2 text-muted-foreground hover:text-derviche transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  Mon compte
                </Link>
                <LogoutButton
                  variant="outline"
                  className="w-full max-w-xs text-lg"
                />
              </>
            ) : (
              // Utilisateur non connecté - Mobile
              <>
                <Link
                  href="/login"
                  className="text-lg font-medium py-2 hover:text-derviche transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Button className="w-full max-w-xs text-lg bg-derviche hover:bg-derviche-dark" asChild>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    Inscription
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
