/**
 * NotificationBadge — Cloche avec badge non-lu dans le header admin
 * Derviche Diffusion
 *
 * Bouton icône cloche avec badge rouge (nombre de non-lus).
 * Placé dans le header du layout admin (en haut à droite).
 */

'use client';

import { memo } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================
// PROPS
// ============================================

interface NotificationBadgeProps {
  unreadCount: number;
  isLoading: boolean;
  onClick: () => void;
}

// ============================================
// COMPOSANT
// ============================================

function NotificationBadgeComponent({
  unreadCount,
  isLoading,
  onClick,
}: NotificationBadgeProps) {
  const hasUnread = unreadCount > 0;
  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative h-9 w-9"
      aria-label={
        hasUnread
          ? `Notifications — ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
          : 'Notifications'
      }
    >
      <Bell
        aria-hidden
        className={cn(
          'size-5 transition-colors',
          hasUnread && !isLoading
            ? 'text-foreground'
            : 'text-muted-foreground'
        )}
      />

      {/* Badge rouge — affiché uniquement si > 0 et pas en chargement */}
      {hasUnread && !isLoading && (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5',
            'flex items-center justify-center',
            'min-w-[18px] h-[18px] rounded-full px-1',
            'text-[10px] font-bold text-white bg-red-500',
            'pointer-events-none'
          )}
          aria-hidden
        >
          {displayCount}
        </span>
      )}
    </Button>
  );
}

NotificationBadgeComponent.displayName = 'NotificationBadge';
export const NotificationBadge = memo(NotificationBadgeComponent);
