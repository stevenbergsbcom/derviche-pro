/**
 * Barre de filtres pour la page spectacles
 * Contient la recherche, le toggle de vue, et le compteur
 */

'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, LayoutList, RotateCcw } from 'lucide-react';
import { SearchInput } from '@/components/admin';
import type { SpectacleFiltersBarProps } from '../types';

export function SpectacleFiltersBar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
  hasActiveFilters,
  onResetFilters,
}: SpectacleFiltersBarProps) {
  return (
    <>
      {/* Compteur de résultats et bouton réinitialiser */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCount} spectacle{filteredCount > 1 ? 's' : ''}
          {hasActiveFilters && ` (sur ${totalCount} au total)`}
        </p>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Réinitialiser les filtres de recherche"
          >
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Barre de recherche + Toggle vue */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Rechercher un spectacle..."
          aria-label="Rechercher un spectacle par titre, compagnie ou catégorie"
        />

        {/* Toggle vue - Desktop uniquement */}
        <div
          className="hidden lg:flex items-center gap-1 border rounded-lg p-1 bg-muted/30"
          role="group"
          aria-label="Mode d'affichage"
        >
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 px-3 ${viewMode === 'list' ? 'bg-derviche hover:bg-derviche-light text-white' : ''}`}
            onClick={() => onViewModeChange('list')}
            aria-pressed={viewMode === 'list'}
            aria-label="Afficher en liste"
          >
            <LayoutList className="w-4 h-4 mr-2" aria-hidden="true" />
            Liste
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 px-3 ${viewMode === 'grid' ? 'bg-derviche hover:bg-derviche-light text-white' : ''}`}
            onClick={() => onViewModeChange('grid')}
            aria-pressed={viewMode === 'grid'}
            aria-label="Afficher en grille"
          >
            <LayoutGrid className="w-4 h-4 mr-2" aria-hidden="true" />
            Grille
          </Button>
        </div>
      </div>
    </>
  );
}
