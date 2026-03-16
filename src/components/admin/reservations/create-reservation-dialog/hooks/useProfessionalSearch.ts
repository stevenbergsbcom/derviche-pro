/**
 * Hook de recherche d'un professionnel existant
 * Derviche Diffusion - Session 189
 *
 * Réutilise l'API /api/pwa/search-professional.
 * Champ unique intelligent : email exact si "@", sinon ILIKE nom/prénom.
 */

import { useCallback, useRef, useState } from 'react';
import type { FoundProfile } from '@/app/api/pwa/search-professional/route';

// ============================================
// TYPES
// ============================================

interface UseProfessionalSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  isSearching: boolean;
  searchDone: boolean;
  profiles: FoundProfile[];
  error: string | null;
  canSearch: boolean;
  handleSearch: () => Promise<void>;
  resetSearch: () => void;
}

// ============================================
// HOOK
// ============================================

export function useProfessionalSearch(): UseProfessionalSearchReturn {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [profiles, setProfiles] = useState<FoundProfile[]>([]);
  const [searchDone, setSearchDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canSearch = query.trim().length >= 2 && !isSearching;

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setSearchDone(false);
    setProfiles([]);
    setError(null);

    try {
      const res = await fetch(
        `/api/pwa/search-professional?q=${encodeURIComponent(q)}`,
        { signal: controller.signal }
      );
      const data = (await res.json()) as {
        found: boolean;
        profiles?: FoundProfile[];
        error?: string;
      };

      setSearchDone(true);

      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la recherche');
        return;
      }

      if (data.found && data.profiles) {
        setProfiles(data.profiles);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('Erreur réseau, réessayez');
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const resetSearch = useCallback(() => {
    abortControllerRef.current?.abort();
    setQuery('');
    setIsSearching(false);
    setProfiles([]);
    setSearchDone(false);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    isSearching,
    searchDone,
    profiles,
    error,
    canSearch,
    handleSearch,
    resetSearch,
  };
}
