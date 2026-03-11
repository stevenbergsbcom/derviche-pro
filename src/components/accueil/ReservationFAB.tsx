/**
 * ReservationFAB — Floating Action Button pour créer une réservation
 * Derviche Diffusion
 *
 * Lit l'URL pour pré-remplir le slotId si disponible :
 *   /accueil                       → pas de slotId (étape select-slot)
 *   /accueil/[showSlug]            → pas de slotId (étape select-slot)
 *   /accueil/[showSlug]/[slotId]   → slotId pré-fourni (étape search)
 *
 * Visible pour : super-admin, admin, externe, company.
 * Pour le rôle company : le slotId pré-fourni est vérifié côté service
 * (canAccessSlot) avant ouverture du drawer — la RLS BDD reste le garde ultime.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import { canAccessSlot } from '@/lib/services/checkin';
import { AddReservationDrawer } from './add-reservation-drawer';

// UUID v4 regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseSlotIdFromPath(pathname: string): string | undefined {
  const segments = pathname.split('/').filter(Boolean);
  // segments[0] = 'accueil', segments[1] = showSlug, segments[2] = slotId
  const maybeSlotId = segments[2];
  return maybeSlotId && UUID_REGEX.test(maybeSlotId) ? maybeSlotId : undefined;
}

export function ReservationFAB() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { role } = useCurrentUserRole();
  const { userId, companyId } = useCheckinAccess();

  // slotId pré-rempli depuis l'URL (peut être undefined)
  const rawSlotId = parseSlotIdFromPath(pathname ?? '');

  // Pour le rôle company : on vérifie que le slot est hosted_by='company'
  // avant de le transmettre au drawer. null = vérification en cours.
  const [verifiedSlotId, setVerifiedSlotId] = useState<string | undefined>(rawSlotId);

  useEffect(() => {
    // Pas de slotId dans l'URL → rien à vérifier
    if (!rawSlotId) {
      setVerifiedSlotId(undefined);
      return;
    }
    // Rôles non-company : on fait confiance à l'URL (RLS protège en BDD)
    if (role !== 'company') {
      setVerifiedSlotId(rawSlotId);
      return;
    }
    // Rôle company : vérification explicite
    if (!userId) return;

    let cancelled = false;
    void (async () => {
      const ok = await canAccessSlot(rawSlotId, userId, role, companyId);
      if (!cancelled) {
        // Si le slot n'est pas accessible, on repasse en mode select-slot
        setVerifiedSlotId(ok ? rawSlotId : undefined);
      }
    })();
    return () => { cancelled = true; };
  }, [rawSlotId, role, userId, companyId]);

  const isVisible =
    role === 'super-admin' ||
    role === 'admin' ||
    role === 'externe' ||
    role === 'company';

  // Le drawer gère lui-même sa fermeture via onOpenChange.
  // handleSuccess sert uniquement à déclencher le refresh de la liste parente
  // (ici le FAB n'a pas de liste à rafraîchir — le drawer appellera onOpenChange(false) au bon moment).
  const handleSuccess = useCallback(() => {
    // intentionnellement vide : pas de setOpen(false) ici
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Créer une réservation"
        className={cn(
          'fixed bottom-6 right-4 z-50',
          'h-14 w-14 rounded-full',
          'bg-gold text-white shadow-lg',
          'hover:bg-gold/90 active:scale-95',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
          'flex items-center justify-center',
        )}
      >
        <UserPlus className="w-6 h-6" aria-hidden="true" />
      </button>

      <AddReservationDrawer
        slotId={verifiedSlotId}
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
