/**
 * GlobalSearchSheet - Recherche globale de réservations PWA
 * Derviche Diffusion
 *
 * Sheet accessible depuis la loupe dans le header.
 * Recherche par nom, prénom, email, structure.
 */

'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  X,
  Loader2,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatSlotDate, formatSlotTime } from '@/lib/services/checkin';
import type { GlobalSearchResult } from '@/lib/services/checkin';
import { StatusBadge } from '@/components/accueil/StatusBadge';
import { useGlobalSearch } from './useGlobalSearch';

// ============================================
// TYPES
// ============================================

interface GlobalSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null;
}

// ============================================
// CARTE RÉSULTAT
// ============================================

function ResultCard({
  result,
  onClose,
}: {
  result: GlobalSearchResult;
  onClose: () => void;
}) {
  const router = useRouter();
  const isCancelled = result.status === 'cancelled';
  const isNoShow = result.status === 'no_show';

  const fullName = [result.guestFirstName, result.guestLastName]
    .filter(Boolean)
    .join(' ') || 'Sans nom';

  const handleClick = () => {
    onClose();
    router.push(`/accueil/${result.showSlug}/${result.slotId}?reservationId=${result.reservationId}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Voir la représentation du ${result.showTitle}`}
      className={cn(
        'w-full text-left rounded-lg border p-4 space-y-3 bg-white',
        'transition-all active:scale-[0.99]',
        'hover:border-primary/50 hover:shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
        isCancelled && 'opacity-60 border-dashed border-gray-300 bg-gray-50',
        isNoShow && 'border-orange-200 bg-orange-50/30'
      )}
    >
      {/* Ligne 1 : Nom + statut check-in */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn(
            'font-semibold text-base truncate',
            isCancelled && 'line-through text-muted-foreground'
          )}>
            {fullName}
          </p>
          {result.guestStructure && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {result.guestStructure}
            </p>
          )}
          {result.guestEmail && (
            <p className="text-sm text-muted-foreground truncate">
              {result.guestEmail}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {/* Statut de réservation */}
          {isCancelled && (
            <Badge variant="outline" className="text-xs text-red-600 border-red-200">
              Annulé
            </Badge>
          )}
          {isNoShow && (
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
              No-show
            </Badge>
          )}

          {/* Statut check-in (uniquement si confirmée) */}
          {!isCancelled && (
            <StatusBadge status={result.checkinStatus} size="sm" />
          )}

          {/* Nombre de places */}
          {result.numPlaces > 1 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{result.numPlaces}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ligne 2 : Spectacle + date + lieu */}
      <div className="space-y-1 pt-1 border-t border-gray-100">
        <p className="text-sm font-medium text-derviche-dark truncate">
          {result.showTitle}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {formatSlotDate(result.slotDate)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {formatSlotTime(result.slotTime)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {result.venueName}
          </span>
        </div>
      </div>
    </button>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function GlobalSearchSheet({
  open,
  onOpenChange,
  companyId,
}: GlobalSearchSheetProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    hasSearched,
    clearSearch,
  } = useGlobalSearch(companyId);

  // Focus auto à l'ouverture
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      clearSearch();
    }
  }, [open, clearSearch]);

  const confirmedResults = results.filter((r) => r.status === 'confirmed');
  const otherResults = results.filter((r) => r.status !== 'confirmed');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="h-[90dvh] flex flex-col p-0"
        aria-label="Recherche globale de réservations"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <SheetTitle className="text-left text-base font-semibold">
            Recherche
          </SheetTitle>

          {/* Champ de recherche */}
          <div className="relative mt-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, prénom, email ou structure..."
              className="h-12 pl-10 pr-10 text-base"
              aria-label="Rechercher une réservation"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

          {/* Chargement */}
          {isLoading && (
            <div className="flex items-center justify-center py-12" role="status">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Erreur */}
          {!isLoading && error && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive" role="alert">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Invite initiale */}
          {!isLoading && !error && !hasSearched && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="w-10 h-10 text-muted-foreground/40 mb-3" aria-hidden="true" />
              <p className="text-base text-muted-foreground">
                Tapez au moins 2 caractères
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Nom, prénom, email ou structure
              </p>
            </div>
          )}

          {/* Aucun résultat */}
          {!isLoading && !error && hasSearched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="w-10 h-10 text-muted-foreground/40 mb-3" aria-hidden="true" />
              <p className="text-base text-muted-foreground">
                Aucune réservation trouvée
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                pour &quot;{query}&quot;
              </p>
            </div>
          )}

          {/* Résultats confirmées + no-show */}
          {!isLoading && !error && confirmedResults.length > 0 && (
            <div className="space-y-3" role="list" aria-label="Réservations trouvées">
              {confirmedResults.map((r) => (
                <div key={r.reservationId} role="listitem">
                  <ResultCard result={r} onClose={() => onOpenChange(false)} />
                </div>
              ))}
            </div>
          )}

          {/* Résultats annulées en bas */}
          {!isLoading && !error && otherResults.length > 0 && (
            <div className="space-y-3 pt-2" role="list" aria-label="Réservations annulées ou no-show">
              {confirmedResults.length > 0 && (
                <p className="text-sm text-muted-foreground font-medium px-1">
                  Annulées / No-show
                </p>
              )}
              {otherResults.map((r) => (
                <div key={r.reservationId} role="listitem">
                  <ResultCard result={r} onClose={() => onOpenChange(false)} />
                </div>
              ))}
            </div>
          )}

          {/* Compteur */}
          {!isLoading && !error && results.length > 0 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              {results.length} résultat{results.length > 1 ? 's' : ''}
              {results.length === 20 ? ' (limite atteinte, affinez votre recherche)' : ''}
            </p>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}
