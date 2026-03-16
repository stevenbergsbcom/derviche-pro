/**
 * ProfessionalSearchBar — Barre de recherche inline pour pré-remplir le formulaire
 * Derviche Diffusion - Session 189
 *
 * Réutilise l'API /api/pwa/search-professional (même que la PWA).
 * Champ unique : email exact si "@", sinon ILIKE nom/prénom.
 */

'use client';

import { useCallback } from 'react';
import { Search, Loader2, CheckCircle2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FoundProfile } from '@/app/api/pwa/search-professional/route';
import { useProfessionalSearch } from '../hooks';

// ============================================
// TYPES
// ============================================

interface ProfessionalSearchBarProps {
  onSelect: (profile: FoundProfile) => void;
  disabled?: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function ProfessionalSearchBar({ onSelect, disabled }: ProfessionalSearchBarProps) {
  const {
    query,
    setQuery,
    isSearching,
    searchDone,
    profiles,
    error,
    canSearch,
    handleSearch,
  } = useProfessionalSearch();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && canSearch) {
        e.preventDefault();
        void handleSearch();
      }
    },
    [canSearch, handleSearch]
  );

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Rechercher un professionnel</Label>

      {/* Input + bouton */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="jean.dupont@theatre.fr ou Dupont"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          disabled={isSearching || disabled}
          autoComplete="off"
          aria-label="Rechercher par email ou nom"
        />
        <Button
          type="button"
          onClick={() => void handleSearch()}
          disabled={!canSearch || disabled}
          variant="outline"
          className="shrink-0"
          aria-label="Lancer la recherche"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="w-4 h-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Minimum 2 caractères &middot; Email exact ou nom partiel
      </p>

      {/* Erreur */}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Résultats */}
      {searchDone && (
        <div role="status" aria-live="polite">
          {profiles.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {profiles.length} résultat{profiles.length > 1 ? 's' : ''} trouvé
                {profiles.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-1.5">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => onSelect(profile)}
                    disabled={disabled}
                    className="w-full text-left rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 active:bg-green-200 px-3 py-2 transition-colors disabled:opacity-50"
                    aria-label={`Sélectionner ${profile.firstName ?? ''} ${profile.lastName ?? ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2
                        className="w-4 h-4 text-green-600 shrink-0"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-green-800 truncate">
                          {profile.firstName} {profile.lastName}
                          {profile.organization && (
                            <span className="font-normal text-green-600">
                              {' '}&middot; {profile.organization}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-green-500 truncate">
                          {profile.email}
                          {profile.phone && <> &middot; {profile.phone}</>}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <div>
                  <span className="text-sm font-medium text-amber-800">
                    Aucun compte trouvé
                  </span>
                  <span className="text-xs text-amber-600 ml-2">
                    Remplissez les champs manuellement ci-dessous.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
