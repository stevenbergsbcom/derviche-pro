/**
 * NotificationSheet — Panneau latéral des notifications admin
 * Derviche Diffusion
 *
 * S'ouvre depuis le badge cloche de la sidebar.
 * Affiche la liste paginée des notifications avec :
 * - En-tête : titre + bouton "tout marquer lu"
 * - Liste scrollable des notifications
 * - Pagination bas de page
 * - États : loading skeleton / vide / erreur
 */

'use client';

import { memo, useCallback, useState } from 'react';
import { CheckCheck, Loader2, BellOff, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationItem } from './notification-item';
import type { UseNotificationsReturn } from '@/hooks/use-notifications';

// ============================================
// PROPS
// ============================================

interface NotificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hook: UseNotificationsReturn;
}

// ============================================
// SOUS-COMPOSANT : SKELETON
// ============================================

function NotificationSkeleton() {
  return (
    <div className="px-4 py-3 flex gap-3 items-start">
      <Skeleton className="mt-0.5 size-7 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

// ============================================
// SOUS-COMPOSANT : PAGINATION
// ============================================

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}

function NotificationPagination({ page, totalPages, total, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
      <span className="text-xs text-muted-foreground">
        {total} notification{total > 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Page précédente"
        >
          ←
        </Button>
        <span className="text-xs px-2 text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Page suivante"
        >
          →
        </Button>
      </div>
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

function NotificationSheetComponent({
  open,
  onOpenChange,
  hook,
}: NotificationSheetProps) {
  const {
    notifications,
    total,
    page,
    totalPages,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissAll,
    goToPage,
  } = hook;

  const [confirmDismiss, setConfirmDismiss] = useState(false);

  const handleClose = useCallback(() => {
    setConfirmDismiss(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleDismissAll = useCallback(async () => {
    await dismissAll();
    setConfirmDismiss(false);
  }, [dismissAll]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[420px] p-0 flex flex-col"
      >
        {/* En-tête */}
        <SheetHeader className="px-4 pt-3 pb-2 border-b shrink-0">
          {/* Ligne 1 : titre + badge non lus — pr-8 pour ne pas chevaucher la croix native */}
          <div className="flex items-center pr-8">
            <SheetTitle className="text-base font-semibold">
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground whitespace-nowrap">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Ligne 2 : actions (masquées si liste vide) */}
          {(notifications.length > 0 || confirmDismiss) && (
            <div className="flex items-center gap-1 mt-1">
              {unreadCount > 0 && !confirmDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground px-2"
                  onClick={() => void handleMarkAllAsRead()}
                  aria-label="Tout marquer comme lu"
                >
                  <CheckCheck className="size-3.5" aria-hidden />
                  Tout lire
                </Button>
              )}

              {notifications.length > 0 && !confirmDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive px-2"
                  onClick={() => setConfirmDismiss(true)}
                  aria-label="Vider mes notifications"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Vider
                </Button>
              )}

              {confirmDismiss && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Vider pour moi ?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6 px-3 text-xs"
                    onClick={() => void handleDismissAll()}
                    aria-label="Confirmer vider les notifications"
                  >
                    Confirmer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setConfirmDismiss(false)}
                  >
                    Annuler
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* État : chargement */}
          {isLoading && (
            <div aria-busy="true" aria-label="Chargement des notifications">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <NotificationSkeleton />
                  {i < 4 && <Separator />}
                </div>
              ))}
            </div>
          )}

          {/* État : erreur */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void hook.loadNotifications(page)}
              >
                Réessayer
              </Button>
            </div>
          )}

          {/* État : liste vide */}
          {!isLoading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
              <BellOff className="size-8 text-muted-foreground/50" aria-hidden />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aucune notification
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Les nouvelles réservations, annulations et modifications apparaîtront ici.
                </p>
              </div>
            </div>
          )}

          {/* Liste des notifications
              - Premier chargement (isLoading + liste vide) : skeleton affiché ci-dessus
              - Changement de page (isLoading + liste existante) : liste conservée + spinner bas
              - Chargé (pas isLoading) : liste seule
          */}
          {notifications.length > 0 && (
            <ul role="list" aria-label="Liste des notifications">
              {notifications.map((notif, idx) => (
                <li key={notif.id} role="listitem">
                  <NotificationItem
                    notification={notif}
                    onRead={markAsRead}
                    onClose={handleClose}
                  />
                  {idx < notifications.length - 1 && <Separator />}
                </li>
              ))}
            </ul>
          )}

          {/* Spinner changement de page — liste déjà visible, chargement en cours */}
          {isLoading && notifications.length > 0 && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
            </div>
          )}
        </div>

        {/* Pagination */}
        <NotificationPagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPage={goToPage}
        />
      </SheetContent>
    </Sheet>
  );
}

NotificationSheetComponent.displayName = 'NotificationSheet';
export const NotificationSheet = memo(NotificationSheetComponent);
