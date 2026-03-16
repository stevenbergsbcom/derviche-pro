/**
 * LogsHeader — En-tête du tableau de logs
 * Derviche Diffusion
 *
 * Titre avec compteur, bouton actualiser et bouton vider le journal
 * (avec dialogue de confirmation).
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Server, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { purgeAllAppLogs } from '@/lib/services/maintenance';
import { cn } from '@/lib/utils';
import type { LogCategory, LogLevel, LogStatus } from '../systeme-content';
import { LogsFilterBar } from './logs-filter-bar';

/** Props du composant LogsHeader */
interface LogsHeaderProps {
  /** Nombre total de logs */
  total: number;
  /** Indique si un chargement est en cours */
  isLoading: boolean;
  /** Catégorie sélectionnée */
  category: LogCategory;
  /** Niveau sélectionné */
  level: LogLevel;
  /** Statut sélectionné */
  status: LogStatus;
  /** Callback changement de catégorie */
  onCategoryChange: (val: LogCategory) => void;
  /** Callback changement de niveau */
  onLevelChange: (val: LogLevel) => void;
  /** Callback changement de statut */
  onStatusChange: (val: LogStatus) => void;
  /** Callback actualisation des données */
  onRefresh: () => void;
}

/** En-tête du tableau de logs avec titre, actions et filtres */
export function LogsHeader({
  total,
  isLoading,
  category,
  level,
  status,
  onCategoryChange,
  onLevelChange,
  onStatusChange,
  onRefresh,
}: LogsHeaderProps) {
  const [isPurging, setIsPurging] = useState(false);

  const handlePurge = async () => {
    setIsPurging(true);
    try {
      const result = await purgeAllAppLogs();
      if (!result.success) {
        toast.error(result.error ?? 'Erreur lors de la purge');
        return;
      }
      toast.success(`${result.deleted} événement(s) supprimé(s)`);
      onRefresh();
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <CardHeader className="pb-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Server className="size-4 text-muted-foreground" />
          Journal des événements
          {total > 0 && (
            <Badge variant="secondary" className="text-xs font-normal">
              {total.toLocaleString('fr-FR')}
            </Badge>
          )}
        </CardTitle>

        <div className="flex items-center gap-1">
          {/* Bouton refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
            Actualiser
          </Button>

          {/* Bouton vider le journal */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoading || isPurging || total === 0}
                className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                {isPurging ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Vider
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Vider le journal des événements</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera définitivement les{' '}
                  <strong>{total.toLocaleString('fr-FR')}</strong> événement(s) du journal.
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handlePurge}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Supprimer tout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Filtres */}
      <LogsFilterBar
        category={category}
        level={level}
        status={status}
        onCategoryChange={onCategoryChange}
        onLevelChange={onLevelChange}
        onStatusChange={onStatusChange}
      />
    </CardHeader>
  );
}
