/**
 * RecentReservationsSection - Historique des 20 dernières réservations d'un pro
 * Affiché dans le CheckinDrawer PWA, visible uniquement pour isStaffDD.
 *
 * Derviche Diffusion — Session S152
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PwaRecentReservationEntry } from '@/app/api/pwa/professional/[userId]/recent/route';

// ============================================
// CONFIGURATION STATUTS
// ============================================

const RESERVATION_STATUS_CONFIG = {
  confirmed: { label: 'Confirmée', className: 'bg-green-100 text-green-800 border-green-200' },
  cancelled:  { label: 'Annulée',  className: 'bg-red-100 text-red-800 border-red-200'      },
  no_show:    { label: 'No show',  className: 'bg-gray-100 text-gray-700 border-gray-200'   },
} as const;

const CHECKIN_STATUS_CONFIG: Record<
  NonNullable<PwaRecentReservationEntry['checkin_status']>,
  { label: string; className: string }
> = {
  present_loved:   { label: '❤️ Coup de cœur', className: 'bg-pink-100 text-pink-800 border-pink-200'     },
  present_press:   { label: '📰 Presse',        className: 'bg-purple-100 text-purple-800 border-purple-200' },
  present_neutral: { label: '✓ Présent',        className: 'bg-blue-100 text-blue-800 border-blue-200'    },
  absent:          { label: 'Absent',           className: 'bg-orange-100 text-orange-800 border-orange-200' },
};

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

// ============================================
// PROPS
// ============================================

interface RecentReservationsSectionProps {
  /** ID du professionnel connecté (null = réservation invité → section masquée) */
  userId: string | null | undefined;
  /** Nom d'affichage (pour aria-label) */
  displayName: string;
}

// ============================================
// COMPOSANT
// ============================================

export function RecentReservationsSection({
  userId,
  displayName,
}: RecentReservationsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reservations, setReservations] = useState<PwaRecentReservationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Charger au premier dépliage uniquement
  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/pwa/professional/${userId}/recent`);
      const result = (await res.json()) as {
        success: boolean;
        data?: PwaRecentReservationEntry[];
        error?: string;
      };

      if (!result.success) {
        setError(result.error ?? 'Erreur lors du chargement');
      } else {
        setReservations(result.data ?? []);
      }
    } catch {
      setError('Erreur réseau');
    }

    setIsLoading(false);
    setHasLoaded(true);
  }, [userId]);

  // Chargement automatique à l'ouverture (une seule fois)
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      void load();
    }
  }, [isOpen, hasLoaded, load]);

  // Ne pas afficher si réservation invité (pas de userId)
  if (!userId) return null;

  return (
    <div className="border-t pt-4">
      {/* Bouton toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between px-1 py-1.5 rounded-md',
          'text-sm font-medium text-muted-foreground',
          'hover:text-foreground hover:bg-muted/40 transition-colors',
          isOpen && 'text-foreground'
        )}
        aria-expanded={isOpen}
        aria-label={`Historique des réservations de ${displayName}`}
      >
        <span className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Historique des réservations
          {!isLoading && hasLoaded && reservations.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-muted text-xs w-5 h-5 font-semibold">
              {reservations.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Contenu déplié */}
      {isOpen && (
        <div className="mt-3 space-y-2" role="list" aria-label={`Historique de ${displayName}`}>

          {/* Chargement */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Chargement…</span>
            </div>
          )}

          {/* Erreur */}
          {!isLoading && error && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-xs text-red-700">{error}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setHasLoaded(false); void load(); }}
                  className="h-6 px-2 text-xs text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Réessayer
                </Button>
              </div>
            </div>
          )}

          {/* Vide */}
          {!isLoading && !error && reservations.length === 0 && hasLoaded && (
            <p className="text-xs text-muted-foreground text-center py-3">
              Aucune réservation précédente
            </p>
          )}

          {/* Liste */}
          {!isLoading && !error && reservations.map((entry) => {
            const resaConfig = RESERVATION_STATUS_CONFIG[entry.reservation_status];
            const checkinConfig = entry.checkin_status
              ? CHECKIN_STATUS_CONFIG[entry.checkin_status]
              : null;

            return (
              <div
                key={entry.reservation_id}
                role="listitem"
                className="flex items-start justify-between gap-2 px-2 py-2 bg-muted/30 rounded-md border border-muted/60"
              >
                {/* Gauche : spectacle + date */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate leading-tight">
                    {entry.show_title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(entry.slot_date)} · {formatTime(entry.slot_time)}
                  </p>
                </div>

                {/* Droite : badges */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge
                    className={`text-[10px] px-1.5 py-0 h-4 ${resaConfig.className}`}
                    variant="outline"
                  >
                    {resaConfig.label}
                  </Badge>
                  {checkinConfig && (
                    <Badge
                      className={`text-[10px] px-1.5 py-0 h-4 ${checkinConfig.className}`}
                      variant="outline"
                    >
                      {checkinConfig.label}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
