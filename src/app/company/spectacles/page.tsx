'use client';

import { Film, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function CompanySpectaclesPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-derviche-dark flex items-center gap-2">
                    <Film className="w-7 h-7 text-gold" />
                    Mes spectacles
                </h1>
                <p className="text-muted-foreground">
                    Consultez les détails de vos spectacles
                </p>
            </div>

            {/* Placeholder */}
            <Card>
                <CardContent className="py-16">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
                            <Construction className="w-8 h-8 text-gold" />
                        </div>
                        <h2 className="text-lg font-semibold text-derviche-dark">
                            Page en construction
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Cette page affichera la liste détaillée de vos spectacles avec leurs statistiques individuelles.
                            Elle sera disponible dans une prochaine mise à jour.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
