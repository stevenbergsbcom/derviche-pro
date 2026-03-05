/**
 * WalkInFAB — Floating Action Button pour la création walk-in
 * Derviche Diffusion
 *
 * Bouton flottant en bas à droite de l'interface accueil.
 * Lit l'URL courante pour pré-remplir le spectacle et le créneau.
 *
 * Logique de contexte URL :
 *   /accueil                       → aucun contexte
 *   /accueil/[showSlug]            → spectacle pré-sélectionné
 *   /accueil/[showSlug]/[slotId]   → spectacle + créneau pré-sélectionnés
 *
 * Visible uniquement pour super-admin, admin, et externe.
 */

'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { WalkInDrawer } from './walkin-drawer';

// ============================================
// CONSTANTES
// ============================================

/** UUID v4 regex — pour distinguer un slotId d'un autre segment */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// HELPERS
// ============================================

/**
 * Extrait le contexte (showSlug + slotId) depuis le pathname accueil.
 * /accueil/[showSlug]/[slotId]
 */
function parseAccueilContext(pathname: string): {
  showSlug?: string;
  slotId?: string;
} {
  // segments = ['', 'accueil', 'showSlug', 'slotId']
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'accueil') return {};

  const showSlug = segments[1]; // peut être undefined
  const maybeSlotId = segments[2]; // peut être undefined

  return {
    showSlug: showSlug ?? undefined,
    slotId: maybeSlotId && UUID_REGEX.test(maybeSlotId) ? maybeSlotId : undefined,
  };
}

// ============================================
// COMPOSANT
// ============================================

export function WalkInFAB() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { role } = useCurrentUserRole();

  // Seuls les rôles internes peuvent créer une réservation walk-in
  const isVisible =
    role === 'super-admin' || role === 'admin' || role === 'externe';

  const { showSlug, slotId } = parseAccueilContext(pathname ?? '');

  const handleSuccess = useCallback((reservationId: string) => {
    // Le toast de succès est déjà affiché par le hook
    // On pourrait ici déclencher un refresh de la liste si nécessaire
    void reservationId; // utilisé pour éviter le warning lint
    setOpen(false);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Créer une réservation walk-in"
        className={cn(
          // Position fixe en bas à droite, au-dessus du contenu
          'fixed bottom-6 right-4 z-50',
          // Taille et forme
          'h-14 w-14 rounded-full',
          // Couleurs
          'bg-gold text-white shadow-lg',
          // Hover / active
          'hover:bg-gold/90 active:scale-95',
          // Transitions
          'transition-all duration-150',
          // Focus visible pour accessibilité
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
          // Flex pour centrer l'icône
          'flex items-center justify-center',
        )}
      >
        <UserPlus className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Drawer walk-in */}
      <WalkInDrawer
        open={open}
        onOpenChange={setOpen}
        defaultShowSlug={showSlug}
        defaultSlotId={slotId}
        onSuccess={handleSuccess}
      />
    </>
  );
}
