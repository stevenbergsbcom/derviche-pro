/**
 * EmailSearchStep — Étape 1 du drawer walk-in
 * Derviche Diffusion
 *
 * Permet de chercher si un professionnel a déjà un compte,
 * avant de passer au formulaire de réservation.
 */

'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, CheckCircle2, UserPlus, ArrowRight } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface EmailSearchStepProps {
  searchEmail: string;
  onEmailChange: (email: string) => void;
  isSearching: boolean;
  searchDone: boolean;
  foundProfileName: string | null;
  foundProfileOrg: string | null;
  onSearch: () => Promise<void>;
  onContinue: () => void;
  disabled?: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function EmailSearchStep({
  searchEmail,
  onEmailChange,
  isSearching,
  searchDone,
  foundProfileName,
  foundProfileOrg,
  onSearch,
  onContinue,
  disabled,
}: EmailSearchStepProps) {
  // Permettre la recherche via la touche Entrée
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchEmail.trim() && !isSearching) {
        e.preventDefault();
        void onSearch();
      }
    },
    [searchEmail, isSearching, onSearch]
  );

  const canSearch = searchEmail.trim().length > 0 && !isSearching && !disabled;
  const canContinue = searchDone && !isSearching && !disabled;

  return (
    <div className="space-y-5">
      {/* Explication */}
      <p className="text-sm text-muted-foreground">
        Entrez l&apos;email du professionnel pour vérifier s&apos;il possède un compte.
        Les informations seront pré-remplies automatiquement.
      </p>

      {/* Champ email + bouton recherche */}
      <div className="space-y-2">
        <Label htmlFor="walkin-email">Adresse email</Label>
        <div className="flex gap-2">
          <Input
            id="walkin-email"
            type="email"
            placeholder="jean.dupont@theatre.fr"
            value={searchEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSearching || disabled}
            autoComplete="off"
            autoFocus
            className="flex-1"
            aria-label="Email du professionnel à rechercher"
          />
          <Button
            onClick={() => void onSearch()}
            disabled={!canSearch}
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Rechercher le professionnel"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Résultat de la recherche */}
      {searchDone && (
        <div
          role="status"
          aria-live="polite"
          className={
            foundProfileName
              ? 'rounded-lg border border-green-200 bg-green-50 p-4 space-y-1'
              : 'rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-1'
          }
        >
          {foundProfileName ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" aria-hidden="true" />
                <span className="text-sm font-semibold text-green-800">
                  Compte trouvé
                </span>
              </div>
              <p className="text-sm text-green-700 pl-6">
                {foundProfileName}
                {foundProfileOrg && (
                  <span className="text-green-600 font-normal"> — {foundProfileOrg}</span>
                )}
              </p>
              <p className="text-xs text-green-600 pl-6">
                Les informations seront pré-remplies dans le formulaire.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span className="text-sm font-semibold text-amber-800">
                  Aucun compte trouvé
                </span>
              </div>
              <p className="text-xs text-amber-600 pl-6">
                La réservation sera créée en tant qu&apos;invité avec cet email.
              </p>
            </>
          )}
        </div>
      )}

      {/* Bouton continuer */}
      {canContinue && (
        <Button
          onClick={onContinue}
          className="w-full bg-derviche hover:bg-derviche/90"
          aria-label="Passer au formulaire de réservation"
        >
          Continuer
          <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
        </Button>
      )}

      {/* Option passer directement sans recherche */}
      {!searchDone && (
        <button
          type="button"
          onClick={onContinue}
          disabled={disabled}
          className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50 text-center py-1"
          aria-label="Passer directement au formulaire sans rechercher"
        >
          Passer directement au formulaire
        </button>
      )}
    </div>
  );
}
