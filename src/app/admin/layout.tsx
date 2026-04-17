'use client';

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminBar } from '@/components/admin/admin-bar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AdminNotificationsWrapper } from '@/components/admin/notifications/admin-notifications-wrapper';
import { PreferencesDirtyProvider } from '@/components/admin/preferences-dirty';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminBar />

      {/* PreferencesDirtyProvider partage la garde « modifs non sauvegardées »
          entre le sous-menu sidebar Préférences et la page preferences. */}
      <PreferencesDirtyProvider>
        <SidebarProvider>
          <AdminSidebar />

          <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" aria-label="Ouvrir/fermer le menu" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold text-derviche-dark lg:hidden">
              Administration
            </h1>

            {/* Cloche notifications — admin/super-admin uniquement */}
            <div className="ml-auto">
              <AdminNotificationsWrapper />
            </div>
          </header>

          <div className="flex-1 p-4 lg:p-8">{children}</div>
        </SidebarInset>
        </SidebarProvider>
      </PreferencesDirtyProvider>
    </>
  );
}
