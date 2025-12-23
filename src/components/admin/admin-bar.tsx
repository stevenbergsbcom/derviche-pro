'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

// Emails des admins (fallback pour le mode maquette sans BDD)
const ADMIN_EMAILS = ['steven.berg@sbcom.fr'];

// Préfixes de routes où la barre admin ne doit PAS s'afficher
const EXCLUDED_ROUTE_PREFIXES = ['/admin', '/checkin', '/compagnie'];

/**
 * Barre admin flottante affichée sur les pages publiques
 * Visible uniquement pour les super-admin et admin
 */
export function AdminBar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Vérifier si on est sur une route exclue
  const isExcludedRoute = EXCLUDED_ROUTE_PREFIXES.some(prefix => pathname?.startsWith(prefix));

  useEffect(() => {
    const supabase = createClient();

    // Fonction pour vérifier si l'utilisateur est admin
    const checkIsAdmin = (user: User | null) => {
      if (!user?.email) return false;
      return ADMIN_EMAILS.includes(user.email);
    };

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const isAdmin = checkIsAdmin(session?.user ?? null);
      setIsVisible(isAdmin);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Ne rien afficher si pas admin, fermé, ou sur une route exclue
  if (!isVisible || isDismissed || isExcludedRoute) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-derviche-dark text-white px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-4 h-4 text-gold" />
          <span className="text-sm font-medium">
            Mode Admin — Vous visualisez le site public
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/spectacles"
            className="text-sm font-medium text-gold hover:text-gold/80 transition-colors"
          >
            ← Retour à l&apos;administration
          </Link>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Fermer la barre admin"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
