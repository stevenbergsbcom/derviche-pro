/**
 * LogRow — Ligne individuelle du tableau de logs
 * Derviche Diffusion
 *
 * Affiche une ligne de log avec catégorie, action, statut, acteur et contexte.
 * Expandable pour afficher les détails JSONB.
 */

'use client';

import { useState } from 'react';
import {
  User,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AppLog } from '@/app/api/admin/logs/route';
import { CATEGORY_CONFIG, LEVEL_CONFIG, ROLE_LABELS, formatDate, formatActionLabel } from './logs-config';
import { LogDetails } from './log-details';

/** Props du composant LogRow */
interface LogRowProps {
  /** Données du log à afficher */
  log: AppLog;
}

/** Ligne de log expandable avec détails JSONB */
export function LogRow({ log }: LogRowProps) {
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
