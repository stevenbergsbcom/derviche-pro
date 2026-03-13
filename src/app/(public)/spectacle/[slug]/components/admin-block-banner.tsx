/**
 * AdminBlockBanner — Bandeau d'alerte pour les admins sur la page publique
 * Derviche Diffusion - Page spectacle
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

// ============================================
// PROPS
// ============================================

interface AdminBlockBannerProps {
  isAdminRole: boolean;
  isRoleLoading: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function AdminBlockBanner({ isAdminRole, isRoleLoading }: AdminBlockBannerProps) {
  if (!isAdminRole || isRoleLoading) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-destructive mb-1">
            Accès réservé aux professionnels
          </p>
          <p className="text-muted-foreground mb-3">
            Vous êtes connecté en tant qu&apos;administrateur. Pour effectuer une réservation,
            veuillez utiliser l&apos;interface d&apos;administration.
          </p>
          <Button
            asChild
            size="sm"
            className="bg-derviche hover:bg-derviche-dark text-white"
          >
            <Link href="/admin/reservations">Aller à l&apos;administration →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
