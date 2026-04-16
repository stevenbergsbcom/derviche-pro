/**
 * use-venue-detail - État + fetch du drawer "Détail lieu"
 * Derviche Diffusion
 *
 * Symétrique de `use-show-detail.ts`.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getVenueDetailStats,
  type StatsFilters,
  type VenueDetailRow,
} from '@/lib/services/admin-stats';

// ============================================
// TYPES
// ============================================

export interface UseVenueDetailReturn {
  isOpen: boolean;
  venueId: string | null;
  data: VenueDetailRow[];
  isLoading: boolean;
  error: string | null;
  open: (venueId: string) => void;
  close: () => void;
}

// ============================================
// HOOK
// ============================================

export function useVenueDetail(filters: StatsFilters): UseVenueDetailReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [data, setData] = useState<VenueDetailRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const open = useCallback((id: string) => {
    setVenueId(id);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setError(null);
  }, []);

  const companiesKey = filters.companyIds?.join(',') ?? '';

  useEffect(() => {
    if (!isOpen || !venueId) return;

    const reqId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    void getVenueDetailStats(venueId, filters).then((result) => {
      if (reqId !== requestIdRef.current) return;
      if (result.error) setError(result.error);
      setData(result.data ?? []);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, venueId, filters.from, filters.to, companiesKey]);

  return { isOpen, venueId, data, isLoading, error, open, close };
}
