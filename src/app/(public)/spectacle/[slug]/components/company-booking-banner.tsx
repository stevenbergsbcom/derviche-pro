/**
 * CompanyBookingBanner — Bandeau info pour les compagnies sur la page publique
 * Derviche Diffusion - Page spectacle
 *
 * Affiche un bandeau info neutre (ton bleu) quand une compagnie connectée
 * démarre une réservation depuis le catalogue public. Signale clairement
 * que la réservation sera enregistrée au nom du professionnel saisi dans
 * le formulaire, sans lien avec le compte compagnie (cf. migration 113).
 */

import { Info } from 'lucide-react';

// ============================================
// PROPS
// ============================================

interface CompanyBookingBannerProps {
  /** La compagnie connectée (null tant que non chargée). */
  companyName: string | null;
  /** Si true, on n'affiche pas le bandeau (skeleton). */
  isLoading?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function CompanyBookingBanner({
  companyName,
  isLoading = false,
}: CompanyBookingBannerProps) {
  if (isLoading) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900 mb-1">
            Réservation pour un professionnel
          </p>
          <p className="text-blue-900/80">
            Vous êtes connecté en tant que{' '}
            {companyName ? (
              <strong>{companyName}</strong>
            ) : (
              <strong>compagnie</strong>
            )}
            . Cette réservation sera enregistrée{' '}
            <strong>au nom du professionnel</strong> dont vous saisissez les
            coordonnées ci-dessous, sans lien avec votre compte compagnie.
          </p>
        </div>
      </div>
    </div>
  );
}
