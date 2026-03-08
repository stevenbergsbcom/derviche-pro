/**
 * useGlobalSearch - Hook de recherche globale de réservations
 * Derviche Diffusion
 *
 * Gère le debounce, l'état de chargement et les résultats.
 * Utilise un pattern requestId pour ignorer les réponses obsolètes
 * (évite les race conditions quand plusieurs requêtes sont en vol).
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
  // Incrémenté à chaque requête — on n'applique les setters que si l'id correspond
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

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
      if (!user || !role) {
        setIsLoading(false);
        return;
      }

      // Marquer cette requête avec un id unique
      const currentId = ++requestIdRef.current;

      try {
        const result = await searchReservations(query.trim(), user.id, role, companyId);

        // Ignorer si une requête plus récente a été lancée ou si démonté
        if (currentId !== requestIdRef.current || !isMountedRef.current) return;

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
        if (currentId !== requestIdRef.current || !isMountedRef.current) return;
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
