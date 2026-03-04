/**
 * NotificationBadge — Cloche avec badge non-lu dans la sidebar admin
 * Derviche Diffusion
 *
 * Bouton cloche qui ouvre le NotificationSheet.
 * Badge rouge avec le nombre de non-lus (masqué si 0).
 * Intégré dans le footer de la sidebar admin.
 */

'use client';

import { memo } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarMenuButton,
} from '@/components/ui/sidebar';

// ============================================
// PROPS
// ============================================

interface NotificationBadgeProps {
  /** Nombre de notifications non lues */
  unreadCount: number;
  /** En cours de chargement initial */
  isLoading: boolean;
  /** Callback pour ouvrir le Sheet */
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
  // Affichage : 99+ si plus de 99
  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <SidebarMenuButton
      onClick={onClick}
      tooltip="Notifications"
      className="relative"
      aria-label={
        hasUnread
          ? `Notifications — ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
          : 'Notifications'
      }
    >
      {/* Icône cloche */}
      <Bell
        aria-hidden
        className={cn(
          'size-4 transition-colors',
          hasUnread && !isLoading ? 'text-foreground' : 'text-muted-foreground'
        )}
      />
      <span>Notifications</span>

      {/* Badge non-lu — affiché uniquement si > 0 et pas en chargement */}
      {hasUnread && !isLoading && (
        <span
          className={cn(
            'ml-auto flex items-center justify-center',
            'min-w-[18px] h-[18px] rounded-full px-1',
            'text-[10px] font-bold text-white',
            'bg-red-500 shrink-0'
          )}
          aria-hidden
        >
          {displayCount}
        </span>
      )}
    </SidebarMenuButton>
  );
}

NotificationBadgeComponent.displayName = 'NotificationBadge';
export const NotificationBadge = memo(NotificationBadgeComponent);
