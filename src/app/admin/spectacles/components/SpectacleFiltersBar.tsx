/**
 * Barre de filtres pour la page spectacles
 * Contient la recherche, le toggle de vue, et le compteur
 * S158 - Ajout select de tri
 */

'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, LayoutList, RotateCcw } from 'lucide-react';
import { SearchInput } from '@/components/admin';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SpectacleFiltersBarProps, SpectacleSortValue } from '../types';

export function SpectacleFiltersBar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
  hasActiveFilters,
  onResetFilters,
  sortValue,
  onSortChange,
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

      {/* Barre de recherche + Tri + Toggle vue */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Rechercher un spectacle..."
          aria-label="Rechercher un spectacle par titre, compagnie ou catégorie"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Select tri */}
          <Select
            value={sortValue}
            onValueChange={(v) => onSortChange(v as SpectacleSortValue)}
          >
            <SelectTrigger
              className="w-full sm:w-[190px]"
              aria-label="Trier les spectacles"
            >
              <SelectValue placeholder="Trier par..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title_asc">Titre A→Z</SelectItem>
              <SelectItem value="title_desc">Titre Z→A</SelectItem>
              <SelectItem value="companyName_asc">Compagnie A→Z</SelectItem>
              <SelectItem value="companyName_desc">Compagnie Z→A</SelectItem>
              <SelectItem value="representationsCount_desc">+ de représentations</SelectItem>
              <SelectItem value="representationsCount_asc">- de représentations</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle vue - Desktop uniquement */}
          <div
            className="hidden lg:flex items-center gap-1 border rounded-lg p-1 bg-muted/30 shrink-0"
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
      </div>
    </>
  );
}
