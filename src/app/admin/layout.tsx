'use client';

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminBar } from '@/components/admin/admin-bar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Barre admin (visible uniquement pour les admins connectés) */}
      <AdminBar />

      <SidebarProvider>
        {/* Sidebar */}
        <AdminSidebar />

        {/* Contenu principal */}
        <SidebarInset>
          {/* Header avec trigger sidebar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" aria-label="Ouvrir/fermer le menu" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold text-derviche-dark lg:hidden">
              Administration
            </h1>
          </header>

          {/* Contenu */}
          <div className="flex-1 p-4 lg:p-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
