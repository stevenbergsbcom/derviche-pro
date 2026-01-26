/**
 * SearchBar - Barre de recherche pour les réservations
 * Derviche Diffusion
 */

'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultsCount: number;
  totalCount: number;
}

export function SearchBar({
  value,
  onChange,
  resultsCount,
  totalCount,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="sticky top-0 z-30 bg-gray-50 px-4 py-3 border-b">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Rechercher par nom, structure, email..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 pr-9 bg-white"
          aria-label="Rechercher dans les réservations"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {value && (
        <p className="text-base text-muted-foreground mt-2" aria-live="polite">
          {resultsCount} résultat{resultsCount > 1 ? 's' : ''} sur {totalCount}
        </p>
      )}
    </div>
  );
}
