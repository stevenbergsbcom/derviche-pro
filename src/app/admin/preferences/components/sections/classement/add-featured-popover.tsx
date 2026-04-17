/**
 * AddFeaturedPopover — Sélection d'un spectacle à ajouter aux vedettes
 * Derviche Diffusion — Migration 111
 *
 * Popover simple (pas de shadcn `command` absent du projet) :
 *  - Input search en haut
 *  - Liste scrollable filtrée (titre + compagnie, insensible à la casse)
 *  - Clic sur un item → onSelect(id) + fermeture
 */

'use client';

import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ShowRanking } from '@/lib/services/shows/ranking';
import { cn } from '@/lib/utils';

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

interface AddFeaturedPopoverProps {
  candidates: ShowRanking[];
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function AddFeaturedPopover({
  candidates,
  onSelect,
  disabled = false,
}: AddFeaturedPopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return candidates;
    return candidates.filter(
      (s) => norm(s.title).includes(q) || norm(s.companyName).includes(q),
    );
  }, [candidates, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || candidates.length === 0}
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un spectacle en vedette
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Rechercher un spectacle…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="max-h-80 overflow-y-auto divide-y">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun spectacle trouvé
            </p>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelect(s.id);
                  setOpen(false);
                  setQuery('');
                }}
                className={cn(
                  'w-full text-left px-2 py-2 hover:bg-muted transition-colors rounded-sm',
                  'flex items-start gap-2',
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground truncate italic">
                    {s.companyName}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0',
                    s.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : s.status === 'draft'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-orange-100 text-orange-700',
                  )}
                >
                  {s.status === 'published'
                    ? 'Publié'
                    : s.status === 'draft'
                      ? 'Brouillon'
                      : 'Archivé'}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
