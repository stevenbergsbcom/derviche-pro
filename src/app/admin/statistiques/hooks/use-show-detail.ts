/**
 * use-show-detail - État + fetch du drawer "Détail spectacle"
 * Derviche Diffusion
 *
 * - Track open/closed + showId sélectionné
 * - Fetch uniquement quand le drawer est ouvert
 * - Re-fetch automatique si les filtres globaux changent pendant l'ouverture
 * - requestIdRef pour ignorer les réponses obsolètes (cf. use-stats-data)
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getShowDetailStats,
  type ShowDetailRow,
  type StatsFilters,
} from '@/lib/services/admin-stats';

// ============================================
// TYPES
// ============================================

export interface UseShowDetailReturn {
  isOpen: boolean;
  showId: string | null;
  data: ShowDetailRow[];
  isLoading: boolean;
  error: string | null;
  open: (showId: string) => void;
  close: () => void;
}

// ============================================
// HOOK
// ============================================

/**
 * @param filters Filtres globaux de la page (from/to/companyIds/venueIds).
 *                Le hook re-fetch quand ils changent pendant l'ouverture.
 */
export function useShowDetail(filters: StatsFilters): UseShowDetailReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [showId, setShowId] = useState<string | null>(null);
  const [data, setData] = useState<ShowDetailRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const open = useCallback((id: string) => {
    setShowId(id);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    // Invalider toute requête en vol pour éviter qu'elle mette à jour
    // l'état après la fermeture (flash de données périmées à la réouverture).
    requestIdRef.current++;
    setIsOpen(false);
    setData([]);
    setIsLoading(false);
    setError(null);
    // On garde showId pour que l'animation de fermeture ne fasse pas disparaître
    // le header avant la fin de la transition. Il sera écrasé au prochain open.
  }, []);

  // Stabiliser les arrays dans la dépendance
  const companiesKey = filters.companyIds?.join(',') ?? '';
  const venuesKey = filters.venueIds?.join(',') ?? '';

  useEffect(() => {
    if (!isOpen || !showId) return;

    const reqId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    void getShowDetailStats(showId, filters).then((result) => {
      if (reqId !== requestIdRef.current) return;
      if (result.error) setError(result.error);
      setData(result.data ?? []);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, showId, filters.from, filters.to, companiesKey, venuesKey]);

  return { isOpen, showId, data, isLoading, error, open, close };
}
