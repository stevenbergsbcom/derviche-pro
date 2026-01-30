/**
 * Composant FiltersSection - Filtres réservations compagnie
 * Derviche Diffusion - Session 117
 * 
 * Section collapsible avec:
 * - Barre de recherche avec debounce
 * - Filtres: spectacle, statut, check-in, période
 * - Presets de dates rapides
 * - Dates personnalisées
 * - Tri
 */

'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, X, ChevronDown, Filter } from 'lucide-react';
import { type SortOption, SORT_OPTIONS } from '@/components/company/reservations';
import {
  DATE_PRESETS,
  CHECKIN_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  PERIOD_FILTER_OPTIONS,
} from '../constants';
import type { FiltersSectionProps } from '../types';

function FiltersSectionComponent({
  // État UI
  filtersExpanded,
  onToggleExpanded,
  activeFiltersCount,
  
  // Recherche
  searchInput,
  onSearchChange,
  onClearSearch,
  isSearching,
  isDebouncing,
  
  // Filtres API
  filters,
  shows,
  onShowFilter,
  onStatusFilter,
  onCheckinFilter,
  onPeriodFilter,
  onSortChange,
  
  // Dates
  datePreset,
  dateFrom,
  dateTo,
  onDatePreset,
  onDateFromChange,
  onDateToChange,
  
  // Reset
  onResetFilters,
}: FiltersSectionProps) {
  return (
    <Card className="bg-card/80">
      <CardContent className="p-3 md:p-4">
        {/* Ligne principale : recherche + bouton filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <Input
              placeholder="Rechercher par nom, email..."
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-9"
              aria-label="Rechercher des réservations"
            />
            {searchInput && (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <X aria-hidden="true" className="w-4 h-4" />
              </button>
            )}
            {(isSearching || isDebouncing) && (
              <Loader2
                aria-hidden="true"
                className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground"
              />
            )}
          </div>

          {/* Bouton Filtres */}
          <Button
            variant="outline"
            onClick={onToggleExpanded}
            className="gap-2"
            aria-expanded={filtersExpanded}
            aria-controls="filters-panel"
          >
            <Filter aria-hidden="true" className="w-4 h-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown
              aria-hidden="true"
              className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
            />
          </Button>
        </div>

        {/* Filtres étendus */}
        {filtersExpanded && (
          <div id="filters-panel" className="mt-4 pt-4 border-t space-y-4">
            {/* Grille filtres principaux */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Filtre Spectacle */}
              <div className="space-y-1.5">
                <Label htmlFor="filter-show" className="text-xs">Spectacle</Label>
                <Select value={filters.showId || 'all'} onValueChange={onShowFilter}>
                  <SelectTrigger id="filter-show" className="h-9">
                    <SelectValue placeholder="Tous les spectacles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les spectacles</SelectItem>
                    {shows.map((show) => (
                      <SelectItem key={show.id} value={show.id}>
                        {show.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Statut */}
              <div className="space-y-1.5">
                <Label htmlFor="filter-status" className="text-xs">Statut</Label>
                <Select value={filters.status || 'all'} onValueChange={onStatusFilter}>
                  <SelectTrigger id="filter-status" className="h-9">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Check-in */}
              <div className="space-y-1.5">
                <Label htmlFor="filter-checkin" className="text-xs">Check-in</Label>
                <Select value={filters.checkinStatus || 'all'} onValueChange={onCheckinFilter}>
                  <SelectTrigger id="filter-checkin" className="h-9">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHECKIN_FILTER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Période */}
              <div className="space-y-1.5">
                <Label htmlFor="filter-period" className="text-xs">Période</Label>
                <Select value={filters.period || 'all'} onValueChange={onPeriodFilter}>
                  <SelectTrigger id="filter-period" className="h-9">
                    <SelectValue placeholder="Toutes les périodes" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_FILTER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtres de date avancés */}
            <div className="flex flex-wrap items-end gap-3">
              {/* Presets rapides */}
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-medium">Période rapide</legend>
                <div className="flex gap-1">
                  {DATE_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      type="button"
                      variant={datePreset === preset.value ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => onDatePreset(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </fieldset>

              {/* Date de début */}
              <div className="space-y-1.5">
                <Label htmlFor="date-from" className="text-xs">Du</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="h-9 w-36"
                />
              </div>

              {/* Date de fin */}
              <div className="space-y-1.5">
                <Label htmlFor="date-to" className="text-xs">Au</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="h-9 w-36"
                />
              </div>

              {/* Bouton reset */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="h-9"
              >
                <X aria-hidden="true" className="w-4 h-4 mr-1" />
                Réinitialiser
              </Button>
            </div>

            {/* Tri */}
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-sort" className="text-xs text-muted-foreground">
                Trier par :
              </Label>
              <Select
                value={filters.sortBy || 'slot_date_asc'}
                onValueChange={(value) => onSortChange(value as SortOption)}
              >
                <SelectTrigger id="filter-sort" className="h-8 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

FiltersSectionComponent.displayName = 'FiltersSection';

export const FiltersSection = memo(FiltersSectionComponent);
