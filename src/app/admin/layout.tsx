'use client';

import { useState, useCallback } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminBar } from '@/components/admin/admin-bar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationBadge } from '@/components/admin/notifications/notification-badge';
import { NotificationSheet } from '@/components/admin/notifications/notification-sheet';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const notificationsHook = useNotifications();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { loadNotifications } = notificationsHook;
  const handleBadgeClick = useCallback(() => {
    setSheetOpen(true);
    void loadNotifications(1);
  }, [loadNotifications]);

  return (
    <>
      {/* Barre admin (visible uniquement pour les admins connectés) */}
      <AdminBar />

      <SidebarProvider>
        {/* Sidebar */}
        <AdminSidebar />

        {/* Contenu principal */}
        <SidebarInset>
          {/* Header avec trigger sidebar + cloche notifications */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" aria-label="Ouvrir/fermer le menu" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold text-derviche-dark lg:hidden">
              Administration
            </h1>

            {/* Cloche notifications — poussée à droite */}
            <div className="ml-auto">
              <NotificationBadge
                unreadCount={notificationsHook.unreadCount}
                isLoading={notificationsHook.isBadgeLoading}
                onClick={handleBadgeClick}
              />
            </div>
          </header>

          {/* Contenu */}
          <div className="flex-1 p-4 lg:p-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>

      {/* Sheet notifications — en dehors du SidebarInset pour éviter les conflits z-index */}
      <NotificationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        hook={notificationsHook}
      />
    </>
  );
}
