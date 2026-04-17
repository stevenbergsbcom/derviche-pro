/**
 * VenueDetailDrawer - Panneau latéral "Détail lieu"
 * Derviche Diffusion
 *
 * Inclut un bouton "Exporter PDF" (rapport focalisé sur ce lieu).
 */

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AlertTriangle } from 'lucide-react';
import type { VenueDetailRow, VenueStats } from '@/lib/services/admin-stats';
import { VenueDetailHeader } from './venue-detail-header';
import { VenueDetailKpis } from './venue-detail-kpis';
import { VenueDetailShowsTable } from './venue-detail-shows-table';
import { VenueDetailExportButton } from './venue-detail-export-button';

export interface VenueDetailDrawerProps {
  isOpen: boolean;
  summary: VenueStats | null;
  periodLabel: string;
  /** Bornes exactes de la période (nécessaires pour le nom de fichier PDF). */
  from: string;
  to: string;
  rows: VenueDetailRow[];
  isLoading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  /** Appelé quand l'utilisateur clique sur un spectacle dans la liste. */
  onShowClick: (showId: string) => void;
}

export function VenueDetailDrawer({
  isOpen,
  summary,
  periodLabel,
  from,
  to,
  rows,
  isLoading,
  error,
  onOpenChange,
  onShowClick,
}: VenueDetailDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        {summary ? (
          <>
            <VenueDetailHeader
              name={summary.venueName}
              city={summary.venueCity}
              periodLabel={periodLabel}
            />

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                <VenueDetailKpis row={summary} />

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <section>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    Spectacles joués dans ce lieu
                  </h3>
                  <VenueDetailShowsTable
                    rows={rows}
                    isLoading={isLoading}
                    onShowClick={onShowClick}
                  />
                </section>
              </div>
            </div>

            <div className="flex items-center justify-end border-t px-4 py-3">
              <VenueDetailExportButton
                summary={summary}
                rows={rows}
                periodLabel={periodLabel}
                from={from}
                to={to}
                // Empêche l'export tant que les bornes globales ne sont pas
                // résolues (évite un PDF avec "Du  au " vide).
                disabled={isLoading || !from || !to}
              />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
