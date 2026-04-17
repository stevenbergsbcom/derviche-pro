/**
 * CompanyFilter - Multi-sélection de compagnies
 * Derviche Diffusion
 */

'use client';

import { useEffect, useState } from 'react';
import { getCompanies } from '@/lib/services/companies';
import { logger } from '@/lib/logger';
import { MultiSelectCombobox } from './multi-select-combobox';
import type { SelectOption } from '../../types';

export interface CompanyFilterProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function CompanyFilter({ selectedIds, onChange }: CompanyFilterProps) {
  const [options, setOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getCompanies().then((res) => {
      if (cancelled) return;
      if (res.error) {
        logger.warn('[stats] Erreur getCompanies', { error: res.error });
        return;
      }
      setOptions(
        res.data.map((c) => ({
          id: c.id,
          label: c.name,
          ...(c.city ? { sublabel: c.city } : {}),
        }))
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MultiSelectCombobox
      label="Compagnies"
      placeholder="Rechercher une compagnie..."
      options={options}
      selectedIds={selectedIds}
      onChange={onChange}
      emptyLabel="Aucune compagnie"
    />
  );
}
