/**
 * ShowDetailDrawer - Panneau latéral "Détail spectacle"
 * Derviche Diffusion
 *
 * Wrapper `Sheet` (shadcn) qui affiche :
 *   - Header (titre, compagnie, libellé période)
 *   - Mini-KPIs (5 cartes)
 *   - Tableau des représentations sur la période
 *   - Bouton "Exporter PDF" (rapport focalisé sur ce spectacle)
 */

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AlertTriangle } from 'lucide-react';
import type { ShowDetailRow, ShowStats } from '@/lib/services/admin-stats';
import { ShowDetailHeader } from './show-detail-header';
import { ShowDetailKpis } from './show-detail-kpis';
import { ShowDetailRepresentationsTable } from './show-detail-representations-table';
import { ShowDetailExportButton } from './show-detail-export-button';

export interface ShowDetailDrawerProps {
  isOpen: boolean;
  /** Ligne de synthèse du tableau principal (pour titre, compagnie, KPIs). */
  summary: ShowStats | null;
  /** Libellé lisible de la période filtrée ("Mois en cours", "Personnalisée", etc.). */
  periodLabel: string;
  /** Bornes exactes de la période (nécessaires pour le nom de fichier PDF). */
  from: string;
  to: string;
  /** Détail des représentations (fetch asynchrone). */
  rows: ShowDetailRow[];
  isLoading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ShowDetailDrawer({
  isOpen,
  summary,
  periodLabel,
  from,
  to,
  rows,
  isLoading,
  error,
  onOpenChange,
}: ShowDetailDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        {summary ? (
          <>
            <ShowDetailHeader
              title={summary.showTitle}
              companyName={summary.companyName}
              periodLabel={periodLabel}
            />

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                <ShowDetailKpis row={summary} />

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <section>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    Représentations sur la période
                  </h3>
                  <ShowDetailRepresentationsTable
                    rows={rows}
                    isLoading={isLoading}
                  />
                </section>
              </div>
            </div>

            <div className="flex items-center justify-end border-t px-4 py-3">
              <ShowDetailExportButton
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
