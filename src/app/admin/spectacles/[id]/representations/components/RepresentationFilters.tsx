'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw } from 'lucide-react';
import { formatMonth } from '../helpers';
import type { RepresentationFiltersProps } from '../types';

/**
 * Barre de filtres pour les représentations
 * Inclut : compteur, filtres mois/lieu, recherche par date, reset
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
}: RepresentationFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Compteur et bouton reset */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCount} représentation{filteredCount > 1 ? 's' : ''}
          {hasActiveFilters && ` (sur ${totalCount} au total)`}
        </p>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Réinitialiser les filtres"
          >
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Filtres */}
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
