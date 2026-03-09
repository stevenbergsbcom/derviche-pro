/**
 * Hook useProDashboard
 * Derviche Diffusion
 *
 * Gère le chargement des données du tableau de bord professionnel.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getProDashboard,
  type ProDashboardData,
} from '@/lib/services/pro-dashboard';

interface UseProDashboardReturn {
  data: ProDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProDashboard(): UseProDashboardReturn {
  const [data, setData] = useState<ProDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getProDashboard();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    isLoading,
    error,
    refresh: load,
  };
}
