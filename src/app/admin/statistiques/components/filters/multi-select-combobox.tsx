/**
 * MultiSelectCombobox - Sélection multiple via Popover + recherche
 * Derviche Diffusion
 *
 * Implémentation locale (pas de dépendance à `cmdk`/shadcn Command, non
 * installé dans ce projet). Construite sur Popover + input + liste
 * accessible.
 */

'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SelectOption } from '../../types';

export interface MultiSelectComboboxProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyLabel?: string;
}

export function MultiSelectCombobox({
  label,
  placeholder = 'Rechercher...',
  options,
  selectedIds,
  onChange,
  emptyLabel = 'Aucun résultat',
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const hay = `${opt.label} ${opt.sublabel ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const clearAll = () => onChange([]);

  const triggerLabel =
    selectedIds.length === 0
      ? label
      : `${label} (${selectedIds.length})`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between min-w-40"
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center gap-2 p-2 border-b">
          <Input
            autoFocus
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8"
          />
          {selectedIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2 border-b max-h-20 overflow-y-auto">
            {selectedIds.map((id) => {
              const opt = options.find((o) => o.id === id);
              if (!opt) return null;
              return (
                <Badge
                  key={id}
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => toggle(id)}
                >
                  <span className="truncate max-w-32">{opt.label}</span>
                  <X className="h-3 w-3" />
                </Badge>
              );
            })}
          </div>
        )}

        <ul
          role="listbox"
          aria-multiselectable
          className="max-h-72 overflow-y-auto p-1"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyLabel}
            </li>
          ) : (
            filtered.map((opt) => {
              const selected = selectedIds.includes(opt.id);
              return (
                <li
                  key={opt.id}
                  role="option"
                  aria-selected={selected}
                  tabIndex={0}
                  onClick={() => toggle(opt.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle(opt.id);
                    }
                  }}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer',
                    'hover:bg-accent focus:bg-accent focus:outline-none',
                    selected && 'bg-accent/60'
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="truncate text-xs text-muted-foreground">
                        {opt.sublabel}
                      </div>
                    )}
                  </div>
                  {selected && <Check className="h-4 w-4 shrink-0" />}
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
