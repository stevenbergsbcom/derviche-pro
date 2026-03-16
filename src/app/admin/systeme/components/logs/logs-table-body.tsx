/**
 * LogsTableBody — Corps du tableau de logs
 * Derviche Diffusion
 *
 * Gère les trois états d'affichage : chargement (squelettes),
 * liste vide et liste de logs.
 */

'use client';

import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { AppLog } from '@/app/api/admin/logs/route';
import { LogRow } from './log-row';

/** Props du composant LogsTableBody */
interface LogsTableBodyProps {
  /** Liste des logs à afficher */
  logs: AppLog[];
  /** Indique si un chargement est en cours */
  isLoading: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
}

/** Corps du tableau de logs avec gestion des états */
export function LogsTableBody({ logs, isLoading, error }: LogsTableBodyProps) {
  return (
    <>
      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Catégorie
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Action
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Statut
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Acteur
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Contexte
              </th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-3 py-2">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Aucun log pour ces filtres.
                </td>
              </tr>
            ) : (
              logs.map(log => <LogRow key={log.id} log={log} />)
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
