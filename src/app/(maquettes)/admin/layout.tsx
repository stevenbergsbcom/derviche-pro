'use client';

import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Contenu principal */}
            <main className="flex-1 lg:ml-[260px] bg-muted min-h-screen">
                {/* Header mobile avec bouton hamburger */}
                <div className="lg:hidden sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                        className="h-9 w-9"
                    >
                        <Menu className="w-5 h-5" />
                        <span className="sr-only">Ouvrir le menu</span>
                    </Button>
                    <h1 className="text-lg font-semibold text-derviche-dark">Administration</h1>
                </div>

                {/* Contenu */}
                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
