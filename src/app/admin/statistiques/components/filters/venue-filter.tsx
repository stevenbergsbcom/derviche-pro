/**
 * VenueFilter - Multi-sélection de lieux
 * Derviche Diffusion
 */

'use client';

import { useEffect, useState } from 'react';
import { getVenues } from '@/lib/services/venues';
import { logger } from '@/lib/logger';
import { MultiSelectCombobox } from './multi-select-combobox';
import type { SelectOption } from '../../types';

export interface VenueFilterProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function VenueFilter({ selectedIds, onChange }: VenueFilterProps) {
  const [options, setOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getVenues().then((res) => {
      if (cancelled) return;
      if (res.error) {
        logger.warn('[stats] Erreur getVenues', { error: res.error });
        return;
      }
      setOptions(
        res.data.map((v) => ({
          id: v.id,
          label: v.name,
          sublabel: v.city,
        }))
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MultiSelectCombobox
      label="Lieux"
      placeholder="Rechercher un lieu..."
      options={options}
      selectedIds={selectedIds}
      onChange={onChange}
      emptyLabel="Aucun lieu"
    />
  );
}
