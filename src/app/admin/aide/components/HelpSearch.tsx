/**
 * HelpSearch — Barre de recherche dans l'aide
 * Derviche Diffusion — S197
 *
 * Input dans le header de /admin/aide. Au focus, charge l'index de
 * recherche puis affiche les résultats Fuse.js dans un popover.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useHelpSearch, type HelpSearchResult } from '../hooks/useHelpSearch';
import type { HelpRole } from '@/lib/help/content-loader';
import { cn } from '@/lib/utils';

export function HelpSearch() {
  const router = useRouter();
  const { role } = useCurrentUserRole();
  const { ensureLoaded, search, isLoading, error, isReady } = useHelpSearch(
    (role as HelpRole | null) ?? null,
  );

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HelpSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Charger l'index au premier focus
  const handleFocus = (): void => {
    void ensureLoaded();
    setOpen(true);
  };

  // Fermer au clic extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Rechercher à chaque input
  useEffect(() => {
    if (!isReady || !query.trim()) {
      setResults([]);
      return;
    }
    setResults(search(query, 10));
  }, [query, isReady, search]);

  const handleSelect = (slug: string): void => {
    setOpen(false);
    setQuery('');
    router.push(`/admin/aide/${slug}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        placeholder="Rechercher dans l'aide…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        className="pl-9 pr-9"
        aria-label="Rechercher dans la documentation"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setResults([]);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Effacer la recherche"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Popover résultats */}
      {open && query.trim() && (
        <div
          className={cn(
            'absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-md border bg-popover p-1 shadow-md',
          )}
          role="listbox"
        >
          {isLoading && (
            <p className="p-3 text-sm text-muted-foreground">Chargement…</p>
          )}
          {error && (
            <p className="p-3 text-sm text-destructive">{error}</p>
          )}
          {!isLoading && !error && results.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">
              Aucun résultat pour « {query} ».
            </p>
          )}
          {results.map((r) => (
            <button
              key={r.entry.slug}
              type="button"
              onClick={() => handleSelect(r.entry.slug)}
              className="flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left hover:bg-muted"
              role="option"
              aria-selected="false"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{r.entry.title}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.entry.categoryLabel}
                </span>
              </span>
              <span className="text-xs text-muted-foreground line-clamp-2">
                {r.entry.excerpt}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Link-wrapper pour les résultats navigables par clavier (avenir). V1 : button + router.push
export function HelpSearchResultLink({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  return <Link href={`/admin/aide/${slug}`}>{children}</Link>;
}
