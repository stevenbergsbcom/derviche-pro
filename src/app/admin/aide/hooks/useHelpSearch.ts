/**
 * useHelpSearch — Recherche dans la documentation /admin/aide
 * Derviche Diffusion — S197
 *
 * Charge `public/help-index.json` (généré au build) au premier usage, puis
 * instancie Fuse.js pour offrir une recherche fuzzy instantanée.
 *
 * Scoring :
 *  - titre       : poids 3
 *  - keywords    : poids 2
 *  - categoryLabel : poids 1.5
 *  - body        : poids 1
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Fuse, { type FuseResult } from 'fuse.js';
import type { HelpRole } from '@/lib/help/content-loader';

export interface HelpIndexEntry {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  roles: HelpRole[];
  keywords: string[];
  excerpt: string;
  body: string;
}

interface HelpIndexPayload {
  generatedAt: string;
  count: number;
  articles: HelpIndexEntry[];
}

export interface HelpSearchResult {
  entry: HelpIndexEntry;
  score: number;
  highlightedExcerpt: string;
}

/** Hook principal — à consommer depuis `<HelpSearch/>`. */
export function useHelpSearch(role: HelpRole | null) {
  const [index, setIndex] = useState<HelpIndexEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fuse stocké dans un state pour que `isReady` déclenche bien un re-render
  // quand l'index est disponible (un ref ne notifiait pas React).
  const [fuse, setFuse] = useState<Fuse<HelpIndexEntry> | null>(null);

  // Chargement lazy de l'index à la première invocation
  const ensureLoaded = useCallback(async () => {
    if (index || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/help-index.json', { cache: 'force-cache' });
      if (!res.ok) {
        throw new Error(`Index indisponible (HTTP ${res.status})`);
      }
      const payload = (await res.json()) as HelpIndexPayload;
      setIndex(payload.articles);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [index, isLoading]);

  // Instanciation Fuse après chargement + filtrage rôle.
  // Effet ré-exécuté si l'index arrive (null → Array) ou si le rôle change.
  useEffect(() => {
    if (!index || !role) {
      setFuse(null);
      return;
    }
    const filtered = index.filter((a) => a.roles.includes(role));
    setFuse(
      new Fuse(filtered, {
        keys: [
          { name: 'title', weight: 3 },
          { name: 'keywords', weight: 2 },
          { name: 'categoryLabel', weight: 1.5 },
          { name: 'body', weight: 1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
        includeScore: true,
        includeMatches: false,
      }),
    );
  }, [index, role]);

  /** Recherche synchrone. Retourne [] si l'index n'est pas encore prêt. */
  const search = useCallback(
    (query: string, limit = 15): HelpSearchResult[] => {
      if (!fuse || !query.trim()) return [];
      const results: FuseResult<HelpIndexEntry>[] = fuse.search(query, { limit });
      return results.map((r) => ({
        entry: r.item,
        score: r.score ?? 1,
        highlightedExcerpt: r.item.excerpt,
      }));
    },
    [fuse],
  );

  const isReady = fuse !== null;

  return { ensureLoaded, search, isLoading, error, isReady };
}
