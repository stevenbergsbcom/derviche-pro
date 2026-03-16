'use client';

/**
 * Hook pour le filtrage, recherche et tri des compagnies
 */

import { useState, useMemo, useCallback } from 'react';
import { searchMatch } from '@/lib/utils';
import type { CompanyWithShowsCount } from '@/lib/services/companies';
import type { SortDirection } from '@/components/admin';

export interface UseCompaniesFiltersParams {
  companies: CompanyWithShowsCount[];
}

export interface UseCompaniesFiltersReturn {
  filteredCompanies: CompanyWithShowsCount[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortDir: SortDirection;
  toggleSortDir: () => void;
}

export function useCompaniesFilters({
  companies,
}: UseCompaniesFiltersParams): UseCompaniesFiltersReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim();
    const filtered = query
      ? companies.filter(
          (company) =>
            searchMatch(company.name, query) ||
            searchMatch(company.city || '', query) ||
            searchMatch(company.contact_name || '', query)
        )
      : companies;

    return [...filtered].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'fr');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [searchQuery, companies, sortDir]);

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  return {
    filteredCompanies,
    searchQuery,
    setSearchQuery,
    sortDir,
    toggleSortDir,
  };
}
