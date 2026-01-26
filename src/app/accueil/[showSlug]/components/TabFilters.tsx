/**
 * TabFilters - Onglets de filtrage À venir / Passés
 * Derviche Diffusion
 */

import { CalendarDays, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TabFiltersProps } from '../types';

export function TabFilters({
  activeTab,
  onTabChange,
  upcomingCount,
  pastCount,
}: TabFiltersProps) {
  return (
    <div 
      className="flex gap-2 px-4 py-3 bg-white border-b"
      role="tablist"
      aria-label="Filtrer les représentations"
    >
      <button
        type="button"
        role="tab"
        aria-label="Afficher les représentations à venir"
        aria-selected={activeTab === 'upcoming'}
        aria-controls="slots-panel"
        onClick={() => onTabChange('upcoming')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-base font-medium transition-colors',
          activeTab === 'upcoming'
            ? 'bg-derviche-dark text-white'
            : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
        )}
      >
        <CalendarDays className="w-4 h-4" aria-hidden="true" />
        À venir
        {upcomingCount > 0 && (
          <span 
            className={cn(
              'px-1.5 py-0.5 text-sm rounded-full',
              activeTab === 'upcoming' 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-200 text-muted-foreground'
            )}
            aria-label={`${upcomingCount} représentations à venir`}
          >
            {upcomingCount}
          </span>
        )}
      </button>
      <button
        type="button"
        role="tab"
        aria-label="Afficher les représentations passées"
        aria-selected={activeTab === 'past'}
        aria-controls="slots-panel"
        onClick={() => onTabChange('past')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-base font-medium transition-colors',
          activeTab === 'past'
            ? 'bg-derviche-dark text-white'
            : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
        )}
      >
        <History className="w-4 h-4" aria-hidden="true" />
        Passés
        {pastCount > 0 && (
          <span 
            className={cn(
              'px-1.5 py-0.5 text-sm rounded-full',
              activeTab === 'past' 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-200 text-muted-foreground'
            )}
            aria-label={`${pastCount} représentations passées`}
          >
            {pastCount}
          </span>
        )}
      </button>
    </div>
  );
}
