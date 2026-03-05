/**
 * SearchStep — Étape de recherche d'un professionnel existant
 * Derviche Diffusion
 *
 * Champ unique intelligent :
 *   - Contient "@" → recherche par email exact
 *   - Sinon        → recherche par nom/prénom
 *
 * S'intègre dans AddReservationDrawer comme étape 0.
 * Ne déclenche l'API qu'avec 2+ caractères valides.
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Search,
  Loader2,
  CheckCircle2,
  UserPlus,
  ChevronRight,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FoundProfile } from '@/app/api/pwa/search-professional/route';

// ============================================
// TYPES
// ============================================

export interface SearchStepProps {
  onSelect: (profile: FoundProfile) => void;
  onSkip: () => void;
  disabled?: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function SearchStep({ onSelect, onSkip, disabled }: SearchStepProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [profiles, setProfiles] = useState<FoundProfile[]>([]);
  const [searchDone, setSearchDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canSearch = query.trim().length >= 2 && !isSearching && !disabled;

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) return;

    // Annuler la requête précédente si en cours
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
      const data = await res.json() as { found: boolean; profiles?: FoundProfile[]; error?: string };

      setSearchDone(true);

      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la recherche');
        return;
      }

      if (data.found && data.profiles) {
        setProfiles(data.profiles);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return; // Requête annulée
      setError('Erreur réseau, réessayez');
    } finally {
      setIsSearching(false);
    }
  }, [query]);

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
    <div className="space-y-5">
      {/* Explication */}
      <p className="text-sm text-muted-foreground">
        Recherchez si le professionnel a déjà un compte pour pré-remplir le formulaire.
      </p>

      {/* Champ de recherche */}
      <div className="space-y-2">
        <Label htmlFor="search-pro">Email ou nom</Label>
        <div className="flex gap-2">
          <Input
            id="search-pro"
            type="text"
            placeholder="jean.dupont@theatre.fr ou Dupont"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Reset résultats si l'utilisateur modifie la recherche
              if (searchDone) {
                setSearchDone(false);
                setProfiles([]);
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={isSearching || disabled}
            autoComplete="off"
            autoFocus
            className="flex-1"
            aria-label="Rechercher par email ou nom"
          />
          <Button
            type="button"
            onClick={() => void handleSearch()}
            disabled={!canSearch}
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Lancer la recherche"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum 2 caractères · Email exact ou nom partiel
        </p>
      </div>

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
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {profiles.length} résultat{profiles.length > 1 ? 's' : ''} trouvé
                {profiles.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => onSelect(profile)}
                    disabled={disabled}
                    className="w-full text-left rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 active:bg-green-200 p-3 transition-colors disabled:opacity-50"
                    aria-label={`Sélectionner ${profile.firstName ?? ''} ${profile.lastName ?? ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2
                          className="w-4 h-4 text-green-600 shrink-0"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-green-800 truncate">
                            {profile.firstName} {profile.lastName}
                          </p>
                          {profile.organization && (
                            <p className="text-xs text-green-600 truncate">
                              {profile.organization}
                            </p>
                          )}
                          <p className="text-xs text-green-500 truncate">
                            {profile.email}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className="w-4 h-4 text-green-400 shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <UserPlus
                  className="w-4 h-4 text-amber-600 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-amber-800">
                  Aucun compte trouvé
                </span>
              </div>
              <p className="text-xs text-amber-600 pl-6">
                La réservation sera créée sans compte associé.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Passer sans rechercher */}
      <div className="pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onSkip}
          disabled={disabled}
          className="w-full"
          aria-label="Continuer sans rechercher"
        >
          <Users className="w-4 h-4 mr-2" aria-hidden="true" />
          Continuer sans rechercher
        </Button>
      </div>
    </div>
  );
}
