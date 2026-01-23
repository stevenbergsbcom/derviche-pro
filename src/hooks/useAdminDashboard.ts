/**
 * Hook useAdminDashboard
 * Derviche Diffusion
 * 
 * Gère l'état et le chargement des données du dashboard admin
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAdminDashboard,
  type AdminDashboardData,
} from '@/lib/services/admin-dashboard';

interface UseAdminDashboardReturn {
  data: AdminDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAdminDashboard(): UseAdminDashboardReturn {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Prevent race conditions
  const isLoadingRef = useRef(false);

  const loadDashboard = useCallback(async () => {
    // Prevent concurrent loads
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAdminDashboard();
      
      if (result.error) {
        setError(result.error);
      }
      
      setData(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const refresh = useCallback(async () => {
    await loadDashboard();
  }, [loadDashboard]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}
