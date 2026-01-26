/**
 * ShowHeader - En-tête du spectacle avec titre et compteur
 * Derviche Diffusion
 */

import { Skeleton } from '@/components/ui/skeleton';
import type { ShowHeaderProps } from '../types';

export function ShowHeader({
  title,
  slotsCount,
  isLoading,
  activeTab,
  showFullHistory,
  pastDaysLimit,
}: ShowHeaderProps) {
  // Construire le label du compteur
  const buildLabel = (): string => {
    const plural = slotsCount > 1;
    
    if (activeTab === 'upcoming') {
      return `${slotsCount} représentation${plural ? 's' : ''} à venir`;
    }
    
    const suffix = showFullHistory 
      ? '(historique complet)' 
      : `(${pastDaysLimit} derniers jours)`;
    
    return `${slotsCount} représentation${plural ? 's' : ''} passée${plural ? 's' : ''} ${suffix}`;
  };

  return (
    <header className="bg-white border-b px-4 py-4">
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ) : (
        <>
          <h1 className="text-xl font-bold text-derviche-dark line-clamp-2">
            {title}
          </h1>
          <p 
            className="text-base text-muted-foreground mt-0.5"
            aria-live="polite"
          >
            {buildLabel()}
          </p>
        </>
      )}
    </header>
  );
}
