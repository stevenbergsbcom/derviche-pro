/**
 * LogsTable — Tableau des logs système (orchestrateur)
 * Derviche Diffusion
 *
 * Affiche les logs paginés avec filtres par catégorie, niveau et statut.
 * Chaque ligne est expandable pour voir les détails JSONB.
 *
 * Délègue le rendu aux sous-composants :
 * - LogsHeader : titre, actions (actualiser, vider) et filtres
 * - LogsTableBody : tableau avec gestion des états (loading, vide, données)
 * - LogsPagination : navigation entre les pages
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { AppLog } from '@/app/api/admin/logs/route';
import type { LogCategory, LogLevel, LogStatus } from '../systeme-content';
import { LogsHeader } from './logs-header';
import { LogsTableBody } from './logs-table-body';
import { LogsPagination } from './logs-pagination';

/** Props du composant LogsTable */
interface LogsTableProps {
  /** Liste des logs à afficher */
  logs: AppLog[];
  /** Nombre total de logs (toutes pages) */
  total: number;
  /** Page courante */
  page: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Indique si un chargement est en cours */
  isLoading: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
  /** Catégorie sélectionnée */
  category: LogCategory;
  /** Niveau sélectionné */
  level: LogLevel;
  /** Statut sélectionné */
  status: LogStatus;
  /** Callback changement de page */
  onPageChange: (page: number) => void;
  /** Callback changement de catégorie */
  onCategoryChange: (val: LogCategory) => void;
  /** Callback changement de niveau */
  onLevelChange: (val: LogLevel) => void;
  /** Callback changement de statut */
  onStatusChange: (val: LogStatus) => void;
  /** Callback actualisation des données */
  onRefresh: () => void;
}

/** Tableau de logs système avec filtres et pagination */
export function LogsTable({
  logs,
  total,
  page,
  totalPages,
  isLoading,
  error,
  category,
  level,
  status,
  onPageChange,
  onCategoryChange,
  onLevelChange,
  onStatusChange,
  onRefresh,
}: LogsTableProps) {
  return (
    <Card>
      <LogsHeader
        total={total}
        isLoading={isLoading}
        category={category}
        level={level}
        status={status}
        onCategoryChange={onCategoryChange}
        onLevelChange={onLevelChange}
        onStatusChange={onStatusChange}
        onRefresh={onRefresh}
      />

      <CardContent className="p-0">
        <LogsTableBody
          logs={logs}
          isLoading={isLoading}
          error={error}
        />

        <LogsPagination
          page={page}
          totalPages={totalPages}
          isLoading={isLoading}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}
