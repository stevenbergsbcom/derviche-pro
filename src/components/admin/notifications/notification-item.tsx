/**
 * NotificationItem — Une ligne de notification admin
 * Derviche Diffusion
 *
 * Affiche : icône type + message + date relative
 * Fond différencié selon l'état lu/non-lu
 * Clic → marque comme lu + redirige vers la réservation si disponible
 */

'use client';

import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, CalendarX, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminNotification, NotificationType } from '@/lib/services/notifications';

// ============================================
// CONFIG TYPES
// ============================================

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; label: string; iconClass: string }
> = {
  new_reservation: {
    icon: CalendarPlus,
    label: 'Nouvelle réservation',
    iconClass: 'text-emerald-600',
  },
  cancellation: {
    icon: CalendarX,
    label: 'Annulation',
    iconClass: 'text-red-500',
  },
  modification: {
    icon: CalendarClock,
    label: 'Modification',
    iconClass: 'text-amber-500',
  },
};

// ============================================
// HELPERS
// ============================================

/**
 * Formate une date ISO en temps relatif lisible en français.
 * Ex : "il y a 5 minutes", "il y a 2 heures", "il y a 3 jours"
 */
function formatRelativeDate(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;

  if (isNaN(then)) return '';

  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `il y a ${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  if (diffD < 30)   return `il y a ${diffD}j`;

  const diffM = Math.floor(diffD / 30);
  return `il y a ${diffM} mois`;
}

// ============================================
// PROPS
// ============================================

interface NotificationItemProps {
  notification: AdminNotification;
  onRead: (id: string) => Promise<void>;
  onClose: () => void;
}

// ============================================
// COMPOSANT
// ============================================

function NotificationItemComponent({
  notification,
  onRead,
  onClose,
}: NotificationItemProps) {
  const router = useRouter();
  const config = TYPE_CONFIG[notification.type];
  const Icon   = config.icon;

  const handleClick = useCallback(async () => {
    // Marquer comme lu si pas encore fait
    if (!notification.is_read) {
      await onRead(notification.id);
    }

    // Fermer le Sheet
    onClose();

    // Rediriger vers la réservation si disponible
    if (notification.reservation_id) {
      router.push(`/admin/reservations/${notification.reservation_id}`);
    }
  }, [notification, onRead, onClose, router]);

  return (
    <button
      onClick={() => void handleClick()}
      className={cn(
        'w-full text-left px-4 py-3 flex gap-3 items-start transition-colors',
        'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        notification.is_read
          ? 'opacity-60'
          : 'bg-blue-50/60 dark:bg-blue-950/20'
      )}
      aria-label={`${config.label} : ${notification.message}`}
    >
      {/* Icône type */}
      <span
        className={cn(
          'mt-0.5 shrink-0 rounded-full p-1.5 bg-white dark:bg-muted border',
          notification.is_read ? 'border-border' : 'border-blue-200 dark:border-blue-800'
        )}
      >
        <Icon className={cn('size-3.5', config.iconClass)} aria-hidden />
      </span>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        {/* Badge type + date */}
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={cn(
              'text-[10px] font-semibold uppercase tracking-wide',
              config.iconClass
            )}
          >
            {config.label}
          </span>
          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
            {formatRelativeDate(notification.created_at)}
          </span>
        </div>

        {/* Message principal */}
        <p className="text-sm leading-snug text-foreground line-clamp-2">
          {notification.message}
        </p>

        {/* Spectacle */}
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {notification.show_title}
        </p>
      </div>

      {/* Indicateur non-lu */}
      {!notification.is_read && (
        <span
          className="mt-2 size-2 rounded-full bg-blue-500 shrink-0"
          aria-label="Non lu"
        />
      )}
    </button>
  );
}

NotificationItemComponent.displayName = 'NotificationItem';
export const NotificationItem = memo(NotificationItemComponent);
