/**
 * Composant UsersFilters - Barre de filtres
 * Derviche Diffusion
 */

import { SearchInput } from '@/components/admin';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UsersFiltersProps, RoleFilter } from '../types';
import { ALL_ROLES, ROLE_LABELS, LABELS } from '../constants';

export function UsersFilters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}: UsersFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={LABELS.SEARCH_PLACEHOLDER}
          ariaLabel="Rechercher par nom, email ou compagnie"
        />
      </div>
      <Select
        value={roleFilter}
        onValueChange={(value) => onRoleFilterChange(value as RoleFilter)}
      >
        <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filtrer par rôle">
          <SelectValue placeholder={LABELS.FILTER_ROLE_PLACEHOLDER} />
        </SelectTrigger>
        <SelectContent>
          {ALL_ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {ROLE_LABELS[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
