/**
 * Composant ProfessionalsFilters - Barre de filtres
 * Derviche Diffusion
 */

'use client';

import { SearchInput } from '@/components/admin';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProfessionalsFiltersProps, StatusFilter } from '@/app/admin/professionnels/types';
import { STATUS_FILTERS, STATUS_FILTER_LABELS, LABELS } from '@/app/admin/professionnels/constants';

export function ProfessionalsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  cityFilter,
  onCityFilterChange,
  availableCities,
}: ProfessionalsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Recherche texte */}
      <div className="flex-1">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={LABELS.SEARCH_PLACEHOLDER}
          ariaLabel="Rechercher un professionnel"
        />
      </div>

      {/* Filtre statut */}
      <Select
        value={statusFilter}
        onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}
      >
        <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrer par statut">
          <SelectValue placeholder={LABELS.FILTER_STATUS} />
        </SelectTrigger>
        <SelectContent>
          {STATUS_FILTERS.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_FILTER_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtre ville */}
      {availableCities.length > 0 && (
        <Select
          value={cityFilter === '' ? '_all' : cityFilter}
          onValueChange={(v) => onCityFilterChange(v === '_all' ? '' : v)}
        >
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrer par ville">
            <SelectValue placeholder={LABELS.FILTER_CITY} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{LABELS.ALL_CITIES}</SelectItem>
            {availableCities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
