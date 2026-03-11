/**
 * Section en-tête contextuel
 * Derviche Diffusion - PWA Check-in
 */

import { useMemo } from 'react';
import type { HeaderSectionProps } from '../types';

/**
 * En-tête affichant le titre et le contexte utilisateur
 */
export function HeaderSection({ isAdmin, role, companyName }: HeaderSectionProps) {
  // Sous-titre selon le rôle (mémorisé)
  const subtitle = useMemo(() => {
    if (role === 'company' && companyName) {
      return companyName;
    }
    if (isAdmin) {
      return 'Accès à toutes les représentations';
    }
    return 'Représentations assignées';
  }, [role, companyName, isAdmin]);

  return (
    <header className="bg-white border-b px-4 py-4">
      <h1 className="text-xl font-bold text-derviche-dark">
        {isAdmin ? 'Tous les spectacles' : 'Mes spectacles'}
      </h1>
      <p className="text-base text-muted-foreground mt-0.5">{subtitle}</p>
    </header>
  );
}
