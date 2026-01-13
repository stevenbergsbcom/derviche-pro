'use client';

import { AdminPageHeader } from '@/components/admin';
import { Construction } from 'lucide-react';

export default function AdminPreferencesPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Préférences"
            />
            
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Construction className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                    Page en construction
                </h2>
                <p className="text-muted-foreground">
                    Cette fonctionnalité sera disponible prochainement.
                </p>
            </div>
        </div>
    );
}
