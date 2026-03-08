/**
 * useGlobalSearch - Hook de recherche globale de réservations
 * Derviche Diffusion
 *
 * Gère le debounce, l'état de chargement et les résultats
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { searchReservations } from '@/lib/services/checkin';
import type { GlobalSearchResult } from '@/lib/services/checkin';
import { logger } from '@/lib/logger';

const DEBOUNCE_MS = 300;
const MIN_LENGTH = 2;

interface UseGlobalSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: GlobalSearchResult[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  clearSearch: () => void;
}

export function useGlobalSearch(companyId: string | null): UseGlobalSearchReturn {
  const { user, role } = useCurrentUserRole();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setHasSearched(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Annuler le debounce précédent
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Réinitialiser si query trop courte
    if (query.trim().length < MIN_LENGTH) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      // Annuler la requête précédente
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      if (!user || !role) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await searchReservations(query.trim(), user.id, role, companyId);

        setHasSearched(true);
        setIsLoading(false);

        if (result.error) {
          setError(result.error);
          setResults([]);
        } else {
          setError(null);
          setResults(result.data);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useGlobalSearch - Exception', { error: msg });
        setIsLoading(false);
        setError(msg);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, user, role, companyId]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    hasSearched,
    clearSearch,
  };
}
