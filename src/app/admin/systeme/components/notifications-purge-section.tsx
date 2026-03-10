/**
 * NotificationsPurgeSection — Purge des notifications admin > 90 jours
 * Derviche Diffusion
 *
 * Affiche le nombre de notifications purgables et propose
 * un hard delete après confirmation. Super-admin uniquement.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Trash2, RefreshCw }          from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button }   from '@/components/ui/button';
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
import { cn }       from '@/lib/utils';
import { toast }    from 'sonner';
import { getPurgeCount, purgeOldNotifications } from '@/lib/services/maintenance';

// ============================================
// COMPOSANT
// ============================================

export function NotificationsPurgeSection() {
  const [count,     setCount]     = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurging, setIsPurging] = useState(false);

  // ── Chargement du compteur ─────────────────────────────────────────────────
  const loadCount = useCallback(async () => {
    setIsLoading(true);
    try {
      const n = await getPurgeCount();
      setCount(n);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadCount(); }, [loadCount]);

  // ── Purge ──────────────────────────────────────────────────────────────────
  const handlePurge = useCallback(async () => {
    setIsPurging(true);
    try {
      const result = await purgeOldNotifications();
      if (!result.success) {
        toast.error(result.error ?? 'Erreur lors de la purge');
        return;
      }
      toast.success(
        `${result.deleted ?? 0} notification${(result.deleted ?? 0) > 1 ? 's' : ''} supprimée${(result.deleted ?? 0) > 1 ? 's' : ''}`,
      );
      void loadCount();
    } finally {
      setIsPurging(false);
    }
  }, [loadCount]);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Bell className="size-4 text-muted-foreground" />
          Purge des notifications
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Supprime définitivement les notifications admin de plus de 90 jours.
          Cette opération est irréversible.
        </p>

        {/* Compteur */}
        <div className="flex items-center justify-between rounded-md border px-4 py-3">
          {isLoading ? (
            <div className="h-5 w-48 rounded bg-muted animate-pulse" />
          ) : (
            <span className="text-sm">
              <span className={cn(
                'font-bold tabular-nums text-lg mr-1',
                (count ?? 0) > 0 ? 'text-orange-500' : 'text-emerald-600',
              )}>
                {String(count ?? 0)}
              </span>
              notification{(count ?? 0) > 1 ? 's' : ''} de plus de 90 jours
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => void loadCount()}
            disabled={isLoading}
            aria-label="Rafraîchir le compteur"
          >
            <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
          </Button>
        </div>

        {/* Bouton purge */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
              disabled={isLoading || isPurging || (count ?? 0) === 0}
            >
              <Trash2 className="size-4" />
              {isPurging ? 'Purge en cours…' : 'Purger les notifications'}
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la purge</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action va supprimer définitivement{' '}
                <strong>{String(count ?? 0)} notification{(count ?? 0) > 1 ? 's' : ''}</strong> de
                plus de 90 jours. Cette opération est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => void handlePurge()}
              >
                Confirmer la purge
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
