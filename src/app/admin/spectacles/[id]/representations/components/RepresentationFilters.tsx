'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { formatMonth } from '../helpers';
import type { RepresentationFiltersProps } from '../types';

/**
 * Barre de filtres pour les représentations
 * Inclut : compteur, filtres mois/lieu, recherche par date,
 *          toggle tri asc/desc, masquage des passées, reset
 */
export function RepresentationFilters({
  filteredCount,
  totalCount,
  hasActiveFilters,
  onResetFilters,
  monthFilter,
  onMonthFilterChange,
  availableMonths,
  venueFilter,
  onVenueFilterChange,
  usedVenues,
  dateSearch,
  onDateSearchChange,
  sortDir,
  onSortDirChange,
  hidePast,
  onHidePastChange,
  pastCount,
}: RepresentationFiltersProps) {
  const toggleSort = () => onSortDirChange(sortDir === 'asc' ? 'desc' : 'asc');

  return (
    <div className="space-y-3">
      {/* Ligne 1 : compteur + contrôles tri/passées + reset */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Compteur */}
        <p className="text-sm text-muted-foreground flex-1 min-w-0">
          {filteredCount} représentation{filteredCount > 1 ? 's' : ''}
          {hasActiveFilters && ` (sur ${totalCount} au total)`}
        </p>

        {/* Toggle tri par date */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSort}
          className="gap-1.5 text-xs h-8"
          aria-label={`Trier par date ${sortDir === 'asc' ? 'décroissant' : 'croissant'}`}
        >
          {sortDir === 'asc' ? (
            <ArrowUp className="size-3.5" aria-hidden="true" />
          ) : (
            <ArrowDown className="size-3.5" aria-hidden="true" />
          )}
          Date
        </Button>

        {/* Badge passées masquées / bouton afficher */}
        {hidePast && pastCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onHidePastChange(false)}
            className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground"
            aria-label={`Afficher les ${pastCount} représentations passées`}
          >
            <EyeOff className="size-3.5" aria-hidden="true" />
            <Badge
              variant="secondary"
              className="px-1.5 py-0 text-xs font-normal"
            >
              {pastCount}
            </Badge>
            passée{pastCount > 1 ? 's' : ''} masquée{pastCount > 1 ? 's' : ''}
          </Button>
        ) : !hidePast ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onHidePastChange(true)}
            className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground"
            aria-label="Masquer les représentations passées"
          >
            <Eye className="size-3.5" aria-hidden="true" />
            Masquer les passées
          </Button>
        ) : null}

        {/* Reset filtres */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-muted-foreground hover:text-foreground h-8"
            aria-label="Réinitialiser les filtres"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" aria-hidden="true" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Ligne 2 : selects + recherche */}
      <div className="sm:flex sm:flex-row sm:gap-4">
        <div className="grid grid-cols-2 gap-2 sm:contents">
          {/* Filtre par mois */}
          <div className="sm:flex-1">
            <Select value={monthFilter} onValueChange={onMonthFilterChange}>
              <SelectTrigger aria-label="Filtrer par mois">
                <SelectValue placeholder="Tous les mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {formatMonth(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre par lieu */}
          <div className="sm:flex-1">
            <Select value={venueFilter} onValueChange={onVenueFilterChange}>
              <SelectTrigger aria-label="Filtrer par lieu">
                <SelectValue placeholder="Tous les lieux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les lieux</SelectItem>
                {usedVenues.map((venue) => (
                  <SelectItem key={venue.id} value={String(venue.id)}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Recherche par date */}
        <div className="mt-2 sm:mt-0 sm:flex-1">
          <Input
            type="text"
            placeholder="Rechercher par date..."
            value={dateSearch}
            onChange={(e) => onDateSearchChange(e.target.value)}
            aria-label="Rechercher par date"
          />
        </div>
      </div>
    </div>
  );
}
