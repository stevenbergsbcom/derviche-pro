/**
 * LogsTable — Tableau des logs système
 * Derviche Diffusion
 *
 * Affiche les logs paginés avec filtres par catégorie, niveau et statut.
 * Chaque ligne est expandable pour voir les détails JSONB.
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Mail,
  Calendar,
  BookOpen,
  Server,
  Film,
  User,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
import type { AppLog } from '@/app/api/admin/logs/route';
import type { LogCategory, LogLevel, LogStatus } from './systeme-content';

// ============================================
// CONFIG VISUELS
// ============================================

const CATEGORY_CONFIG: Record<
  AppLog['category'],
  { label: string; icon: React.ElementType; className: string }
> = {
  email:       { label: 'Email',        icon: Mail,     className: 'text-blue-600    bg-blue-50    dark:bg-blue-950/30'    },
  calendar:    { label: 'Calendar',     icon: Calendar, className: 'text-purple-600  bg-purple-50  dark:bg-purple-950/30'  },
  reservation: { label: 'Réservation',  icon: BookOpen, className: 'text-amber-600   bg-amber-50   dark:bg-amber-950/30'   },
  show:        { label: 'Spectacle',    icon: Film,     className: 'text-pink-600    bg-pink-50    dark:bg-pink-950/30'    },
  system:      { label: 'Système',      icon: Server,   className: 'text-slate-600   bg-slate-100  dark:bg-slate-800/50'   },
};

const LEVEL_CONFIG: Record<AppLog['level'], { label: string; className: string }> = {
  info:    { label: 'Info',        className: 'text-muted-foreground' },
  warning: { label: 'Attention',   className: 'text-orange-600' },
  error:   { label: 'Erreur',      className: 'text-red-600 font-semibold' },
};

// ============================================
// HELPERS
// ============================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatActionLabel(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

const ROLE_LABELS: Record<string, string> = {
  'super-admin': 'Super-admin',
  'admin': 'Admin',
  'externe': 'Externe',
  'company': 'Compagnie',
  'professional': 'Pro',
};

// ============================================
// SOUS-COMPOSANT — Détails expandable
// ============================================

function LogDetails({ details }: { details: Record<string, unknown> }) {
  const entries = Object.entries(details).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return <p className="text-xs text-muted-foreground italic">Aucun détail</p>;

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground font-medium whitespace-nowrap">{key}</dt>
          <dd className="text-foreground font-mono break-all">
            {typeof value === 'string' ? value : JSON.stringify(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ============================================
// SOUS-COMPOSANT — Ligne log
// ============================================

function LogRow({ log }: { log: AppLog }) {
  const [expanded, setExpanded] = useState(false);
  const catConfig  = CATEGORY_CONFIG[log.category];
  const lvlConfig  = LEVEL_CONFIG[log.level];
  const CatIcon    = catConfig.icon;
  const hasDetails = Object.keys(log.details ?? {}).length > 0;

  return (
    <>
      <tr
        className={cn(
          'border-b transition-colors',
          log.status === 'error'
            ? 'bg-red-50/40 dark:bg-red-950/10 hover:bg-red-50/70'
            : 'hover:bg-muted/40'
        )}
      >
        {/* Date */}
        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
          {formatDate(log.created_at)}
        </td>

        {/* Catégorie */}
        <td className="px-3 py-2">
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
            catConfig.className
          )}>
            <CatIcon className="size-3" aria-hidden />
            {catConfig.label}
          </span>
        </td>

        {/* Action */}
        <td className="px-3 py-2 text-sm">
          <span className={lvlConfig.className}>
            {formatActionLabel(log.action)}
          </span>
        </td>

        {/* Statut */}
        <td className="px-3 py-2">
          {log.status === 'success' ? (
            <CheckCircle className="size-4 text-emerald-500" aria-label="Succès" />
          ) : (
            <XCircle className="size-4 text-red-500" aria-label="Erreur" />
          )}
        </td>

        {/* Acteur */}
        <td className="px-3 py-2 text-xs max-w-[160px]">
          {log.actor_name ? (
            <div className="flex items-center gap-1.5">
              <User className="size-3 text-muted-foreground shrink-0" aria-hidden />
              <div className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {log.actor_name}
                </span>
                {log.actor_role && (
                  <span className="block text-[10px] text-muted-foreground">
                    {ROLE_LABELS[log.actor_role] ?? log.actor_role}
                  </span>
                )}
              </div>
            </div>
          ) : log.actor_role ? (
            <span className="text-muted-foreground italic">
              {ROLE_LABELS[log.actor_role] ?? log.actor_role}
            </span>
          ) : (
            <span className="text-muted-foreground/50 italic">Système</span>
          )}
        </td>

        {/* Destinataire / contexte (extrait de details) */}
        <td className="px-3 py-2 text-xs text-muted-foreground max-w-[200px] truncate">
          {typeof log.details?.to === 'string'
            ? log.details.to
            : typeof log.details?.guest_name === 'string'
              ? log.details.guest_name
              : typeof log.details?.title === 'string'
                ? log.details.title
                : typeof log.details?.event_id === 'string'
                  ? log.details.event_id
                  : typeof log.details?.error_message === 'string'
                    ? <span className="text-red-600">{log.details.error_message}</span>
                    : null
          }
        </td>

        {/* Expand */}
        <td className="px-3 py-2">
          {hasDetails && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => setExpanded(e => !e)}
              aria-label={expanded ? 'Masquer les détails' : 'Voir les détails'}
            >
              {expanded
                ? <ChevronDown className="size-3.5" />
                : <ChevronRight className="size-3.5" />
              }
            </Button>
          )}
        </td>
      </tr>

      {/* Détails expandables */}
      {expanded && (
        <tr className="border-b bg-muted/30">
          <td colSpan={7} className="px-6 py-3">
            <LogDetails details={log.details ?? {}} />
          </td>
        </tr>
      )}
    </>
  );
}

// ============================================
// PROPS
// ============================================

interface LogsTableProps {
  logs:       AppLog[];
  total:      number;
  page:       number;
  totalPages: number;
  isLoading:  boolean;
  error:      string | null;
  category:   LogCategory;
  level:      LogLevel;
  status:     LogStatus;
  onPageChange:     (page: number) => void;
  onCategoryChange: (val: LogCategory) => void;
  onLevelChange:    (val: LogLevel) => void;
  onStatusChange:   (val: LogStatus) => void;
  onRefresh:        () => void;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

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
    <Card>
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
        <div className="flex flex-wrap gap-2 pt-1">
          <Select value={category} onValueChange={v => onCategoryChange(v as LogCategory)}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="calendar">Calendar</SelectItem>
              <SelectItem value="reservation">Réservation</SelectItem>
              <SelectItem value="show">Spectacle</SelectItem>
              <SelectItem value="system">Système</SelectItem>
            </SelectContent>
          </Select>

          <Select value={level} onValueChange={v => onLevelChange(v as LogLevel)}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous niveaux</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Attention</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={v => onStatusChange(v as LogStatus)}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
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
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Catégorie</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Action</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Statut</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Acteur</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Contexte</th>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Page {page} / {totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
