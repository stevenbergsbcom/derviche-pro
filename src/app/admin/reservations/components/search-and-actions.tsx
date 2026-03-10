/**
 * Composant SearchAndActions pour la page des réservations admin
 * Ligne principale : recherche + spectacle + filtres (toggle) + boutons d'action
 * Derviche Diffusion — S163
 */

'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Loader2,
  X,
  RefreshCw,
  Settings2,
  Download,
  SlidersHorizontal,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface ShowOption {
  id: string;
  title: string;
}

export interface SearchAndActionsProps {
  // Recherche
  searchInput: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  appliedSearch?: string;
  totalResults: number;
  isSearching: boolean;
  isDebouncing: boolean;
  isLoading: boolean;

  // Filtre spectacle (remonté depuis FiltersSection)
  showId?: string;
  showsOptions: ShowOption[];
  isExterne: boolean;
  onShowFilter: (showId: string) => void;

  // Panneau avancé
  filtersExpanded: boolean;
  activeFiltersCount: number;
  onToggleExpanded: () => void;

  // Actions
  isExporting: boolean;
  reservationsCount: number;
  onRefresh: () => void;
  onOpenColumns: () => void;
  onOpenExport: () => void;
}

// ============================================
// COMPOSANT
// ============================================

export function SearchAndActions({
  searchInput,
  onSearchChange,
  onClearSearch,
  appliedSearch,
  totalResults,
  isSearching,
  isDebouncing,
  isLoading,
  showId,
  showsOptions,
  isExterne,
  onShowFilter,
  filtersExpanded,
  activeFiltersCount,
  onToggleExpanded,
  isExporting,
  reservationsCount,
  onRefresh,
  onOpenColumns,
  onOpenExport,
}: SearchAndActionsProps) {
  const showLoader = isSearching || isDebouncing;

  // Nombre de filtres avancés actifs (hors recherche et hors spectacle sur la ligne principale)
  // Math.max(0, ...) garantit que le badge ne peut pas être négatif en cas d'état incohérent
  const advancedFiltersCount = Math.max(
    0,
    activeFiltersCount - (showId ? 1 : 0) - (appliedSearch ? 1 : 0)
  );

  return (
    <div className="space-y-1.5">
      {/* Ligne principale */}
      <div className="flex flex-wrap gap-2 items-center">

        {/* Barre de recherche */}
        <div className="relative flex-1 min-w-[180px]">
          {showLoader ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-derviche animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
          <Input
            placeholder="Rechercher par nom, email, structure..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onClearSearch}
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filtre spectacle */}
        <div className="w-[200px] shrink-0">
          <Select
            value={showId || 'all'}
            onValueChange={onShowFilter}
          >
            <SelectTrigger aria-label="Filtrer par spectacle">
              <SelectValue placeholder={isExterne ? 'Vos spectacles' : 'Tous les spectacles'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {isExterne ? 'Vos spectacles assignés' : 'Tous les spectacles'}
              </SelectItem>
              {showsOptions.map((show) => (
                <SelectItem key={show.id} value={show.id}>
                  {show.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bouton filtres avancés */}
        <Button
          variant={filtersExpanded ? 'default' : 'outline'}
          onClick={onToggleExpanded}
          className={
            filtersExpanded
              ? 'bg-derviche/10 text-derviche hover:bg-derviche/20 border border-derviche/30'
              : ''
          }
          aria-label="Filtres avancés"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">Filtres</span>
          {advancedFiltersCount > 0 && (
            <Badge className="ml-1.5 bg-derviche text-white text-xs px-1.5 py-0 h-4">
              {advancedFiltersCount}
            </Badge>
          )}
        </Button>

        {/* Séparateur visuel */}
        <div className="w-px h-7 bg-border hidden sm:block" />

        {/* Actualiser */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          aria-label="Rafraîchir les données"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>

        {/* Colonnes */}
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenColumns}
          aria-label="Configurer les colonnes"
        >
          <Settings2 className="w-4 h-4" />
        </Button>

        {/* Export */}
        <Button
          variant="outline"
          onClick={onOpenExport}
          disabled={isExporting || reservationsCount === 0}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Export</span>
        </Button>

      </div>

      {/* Compteur de résultats */}
      {!isLoading && (appliedSearch || activeFiltersCount > 0) && (
        <p className="text-xs text-muted-foreground ml-1">
          {totalResults} réservation{totalResults > 1 ? 's' : ''}
          {appliedSearch && ` pour « ${appliedSearch} »`}
        </p>
      )}
    </div>
  );
}
