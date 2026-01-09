'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export interface SearchInputProps {
  /** Valeur actuelle de la recherche */
  value: string;
  /** Callback quand la valeur change */
  onChange: (value: string) => void;
  /** Placeholder du champ */
  placeholder?: string;
  /** Classes CSS additionnelles pour le container */
  className?: string;
}

/**
 * Champ de recherche avec icône intégrée
 * 
 * @example
 * ```tsx
 * <SearchInput
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Rechercher un spectacle..."
 * />
 * ```
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Rechercher...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative w-full lg:max-w-md ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
