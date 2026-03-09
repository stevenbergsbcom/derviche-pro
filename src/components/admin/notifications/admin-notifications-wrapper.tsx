'use client';

/**
 * AdminNotificationsWrapper
 * Derviche Diffusion
 *
 * Monte la cloche de notifications UNIQUEMENT pour les rôles admin et super-admin.
 * L'externe partage le layout /admin mais ne doit pas appeler /api/admin/notifications
 * (403 Forbidden — intentionnel côté API).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationBadge } from '@/components/admin/notifications/notification-badge';
import { NotificationSheet } from '@/components/admin/notifications/notification-sheet';

/** Rôles autorisés à voir les notifications */
const NOTIFICATION_ROLES = ['super-admin', 'admin'];

// ── Sous-composant qui monte le hook ──────────────────────────────────────────

function NotificationsActive() {
  const notificationsHook = useNotifications();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { loadNotifications } = notificationsHook;
  const handleBadgeClick = useCallback(() => {
    setSheetOpen(true);
    void loadNotifications(1);
  }, [loadNotifications]);

  return (
    <>
      <NotificationBadge
        unreadCount={notificationsHook.unreadCount}
        isLoading={notificationsHook.isBadgeLoading}
        onClick={handleBadgeClick}
      />
      <NotificationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        hook={notificationsHook}
      />
    </>
  );
}

// ── Wrapper principal ─────────────────────────────────────────────────────────

export function AdminNotificationsWrapper() {
  const [canViewNotifications, setCanViewNotifications] = useState<boolean | null>(null);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const checkRole = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setCanViewNotifications(false); return; }

        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        setCanViewNotifications(
          data?.role != null && NOTIFICATION_ROLES.includes(data.role)
        );
      } catch {
        setCanViewNotifications(false);
      }
    };

    void checkRole();
  }, []);

  // Pendant la vérification : rien (évite un flash de la cloche)
  if (canViewNotifications === null) return null;
  if (!canViewNotifications) return null;

  return <NotificationsActive />;
}
