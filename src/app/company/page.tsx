'use client';

import { useCompanyDashboard } from '@/hooks';
import { CompanyStatsCards, CompanyUpcomingSlots } from '@/components/company';
import type { CompanyShowWithStats } from '@/lib/services/company-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Film, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// ============================================
// COMPOSANT ERREUR
// ============================================

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
    return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-4 p-8 bg-white rounded-lg shadow max-w-md">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-lg font-semibold text-derviche-dark">
                    Erreur de chargement
                </h2>
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button onClick={onRetry} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Réessayer
                </Button>
            </div>
        </div>
    );
}

// ============================================
// COMPOSANT LISTE DES SPECTACLES
// ============================================

interface ShowsListProps {
    shows: CompanyShowWithStats[] | undefined;
    isLoading: boolean;
}

function ShowsList({ shows, isLoading }: ShowsListProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Film className="w-5 h-5 text-gold" />
                        Mes spectacles
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 bg-muted rounded-lg animate-pulse">
                            <div className="h-5 w-48 bg-muted-foreground/20 rounded mb-2" />
                            <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!shows || shows.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Film className="w-5 h-5 text-gold" />
                        Mes spectacles
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Aucun spectacle enregistré pour votre compagnie
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Afficher les 5 premiers spectacles
    const displayedShows = shows.slice(0, 5);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Film className="w-5 h-5 text-gold" />
                    Mes spectacles
                </CardTitle>
                {shows.length > 5 && (
                    <Link href="/company/spectacles">
                        <Button variant="ghost" size="sm" className="gap-1 text-gold hover:text-gold/80">
                            Voir tous
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                )}
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {displayedShows.map((show) => (
                        <div
                            key={show.id}
                            className="p-4 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium text-derviche-dark">
                                        {show.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {show.total_slots} représentation{show.total_slots > 1 ? 's' : ''} •{' '}
                                        {show.total_reservations} réservation{show.total_reservations > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-medium ${
                                        show.status === 'published' ? 'text-green-600' :
                                        show.status === 'draft' ? 'text-yellow-600' :
                                        'text-muted-foreground'
                                    }`}>
                                        {show.status === 'published' ? 'Publié' :
                                         show.status === 'draft' ? 'Brouillon' :
                                         'Archivé'}
                                    </span>
                                    {show.occupancy_rate > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {show.occupancy_rate}% de remplissage
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================
// PAGE DASHBOARD
// ============================================

export default function CompanyDashboardPage() {
    const { data, isLoading, error, refresh } = useCompanyDashboard();

    // Affichage d'erreur
    if (error && !isLoading) {
        return <ErrorState error={error} onRetry={() => void refresh()} />;
    }

    // Stats par défaut pendant le chargement
    const stats = data?.stats || {
        total_shows: 0,
        total_slots: 0,
        total_reservations: 0,
        total_capacity: 0,
        average_occupancy_rate: 0,
        upcoming_slots_count: 0,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-derviche-dark">
                        Tableau de bord
                    </h1>
                    {data?.company && (
                        <p className="text-muted-foreground">
                            Bienvenue, {data.company.name}
                        </p>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void refresh()}
                    disabled={isLoading}
                    className="gap-2 self-start"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualiser
                </Button>
            </div>

            {/* Cartes statistiques */}
            <CompanyStatsCards stats={stats} isLoading={isLoading} />

            {/* Grille : Spectacles + Créneaux à venir */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Liste des spectacles */}
                <ShowsList shows={data?.shows} isLoading={isLoading} />

                {/* Prochains créneaux */}
                <CompanyUpcomingSlots
                    slots={data?.upcomingSlots || []}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
