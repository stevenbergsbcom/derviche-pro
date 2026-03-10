/**
 * Composant SearchAndActions pour la page des réservations admin
 * Barre de recherche avec debounce + boutons d'action
 * Extrait de page.tsx - Session 106
 * Derviche Diffusion
 */

'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Loader2, 
  X, 
  RefreshCw, 
  Settings2, 
  Download 
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface SearchAndActionsProps {
  /** Valeur actuelle de l'input de recherche */
  searchInput: string;
  /** Handler pour mettre à jour l'input de recherche */
  onSearchChange: (value: string) => void;
  /** Handler pour effacer la recherche */
  onClearSearch: () => void;
  /** Valeur de recherche appliquée (après debounce) */
  appliedSearch?: string;
  /** Total de résultats affichés */
  totalResults: number;
  /** Indique si une recherche est en cours */
  isSearching: boolean;
  /** Indique si le debounce est en cours */
  isDebouncing: boolean;
  /** Indique si les données sont en chargement */
  isLoading: boolean;
  /** Indique si l'export est en cours */
  isExporting: boolean;
  /** Nombre de réservations disponibles pour l'export */
  reservationsCount: number;
  /** Nombre de filtres actifs (pour afficher le compteur même sans recherche) */
  activeFiltersCount: number;
  /** Handler pour rafraîchir les données */
  onRefresh: () => void;
  /** Handler pour ouvrir le dialog des colonnes */
  onOpenColumns: () => void;
  /** Handler pour ouvrir le dialog d'export */
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
  isExporting,
  reservationsCount,
  activeFiltersCount,
  onRefresh,
  onOpenColumns,
  onOpenExport,
}: SearchAndActionsProps) {
  const showLoader = isSearching || isDebouncing;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Barre de recherche */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          {showLoader ? (
            <Loader2 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-derviche animate-spin" 
            />
          ) : (
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" 
            />
          )}
          <Input
            placeholder="Rechercher par nom, email, téléphone, structure..."
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
        {/* Compteur de résultats */}
        {!isLoading && (appliedSearch || activeFiltersCount > 0) && (
          <p className="text-xs text-muted-foreground mt-1 ml-1">
            {totalResults} réservation{totalResults > 1 ? 's' : ''}
            {appliedSearch && ` pour « ${appliedSearch} »`}
          </p>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onRefresh}
          aria-label="Rafraîchir les données"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onOpenColumns}
          aria-label="Configurer les colonnes"
        >
          <Settings2 className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          onClick={onOpenExport} 
          disabled={isExporting || reservationsCount === 0}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Export</span>
        </Button>
      </div>
    </div>
  );
}
