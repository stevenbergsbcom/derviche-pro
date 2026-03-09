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
// Compact : rarement plus de 2 items — pas de grille, liste horizontale dense
// ============================================

interface ShowsListProps {
    shows: CompanyShowWithStats[] | undefined;
    isLoading: boolean;
}

function ShowsList({ shows, isLoading }: ShowsListProps) {
    if (isLoading) {
        return (
            <Card className="py-5 gap-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-derviche-dark">
                        <Film className="w-5 h-5 text-gold" />
                        Mes spectacles
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex flex-wrap gap-px divide-y">
                        {[1, 2].map((i) => (
                            <div key={i} className="w-full px-4 py-3 animate-pulse">
                                <div className="h-4 w-48 bg-muted rounded mb-1" />
                                <div className="h-3 w-32 bg-muted rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!shows || shows.length === 0) {
        return (
            <Card className="py-5 gap-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-derviche-dark">
                        <Film className="w-5 h-5 text-gold" />
                        Mes spectacles
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-6 text-sm">
                        Aucun spectacle enregistré pour votre compagnie
                    </p>
                </CardContent>
            </Card>
        );
    }

    const displayedShows = shows.slice(0, 5);

    return (
        <Card className="py-5 gap-3">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg text-derviche-dark">
                        <Film className="w-5 h-5 text-gold" />
                        Mes spectacles
                    </CardTitle>
                    {shows.length > 5 && (
                        <Link href="/company/spectacles">
                            <Button variant="ghost" size="sm" className="gap-1 text-xs text-gold hover:text-gold/80">
                                Voir tous
                                <ArrowRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Affichage en ligne horizontale : chaque spectacle sur une seule ligne dense */}
                <div className="divide-y">
                    {displayedShows.map((show) => (
                        <div
                            key={show.id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <h4 className="font-medium text-sm text-derviche-dark truncate">
                                    {show.title}
                                </h4>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {show.total_slots} repré{show.total_slots > 1 ? 's' : ''} · {show.total_reservations} résa{show.total_reservations > 1 ? 's' : ''}
                                </span>
                            </div>
                            <span className={`text-xs font-medium shrink-0 ml-3 ${
                                show.status === 'published' ? 'text-green-600' :
                                show.status === 'draft' ? 'text-yellow-600' :
                                'text-muted-foreground'
                            }`}>
                                {show.status === 'published' ? 'Publié' :
                                 show.status === 'draft' ? 'Brouillon' :
                                 'Archivé'}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================
// PAGE DASHBOARD
// Layout empilé :
//   1. Stats cards (3 cartes)
//   2. Spectacles (pleine largeur, compact)
//   3. Prochains créneaux (pleine largeur, peut être long)
// ============================================

export default function CompanyDashboardPage() {
    const { data, isLoading, error, refresh } = useCompanyDashboard();

    if (error && !isLoading) {
        return <ErrorState error={error} onRetry={() => void refresh()} />;
    }

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

            {/* Cartes statistiques (3 cartes) */}
            <CompanyStatsCards stats={stats} isLoading={isLoading} />

            {/* Spectacles — compact, pleine largeur */}
            <ShowsList shows={data?.shows} isLoading={isLoading} />

            {/* Prochains créneaux — pleine largeur, peut être très long */}
            <CompanyUpcomingSlots
                slots={data?.upcomingSlots || []}
                isLoading={isLoading}
            />
        </div>
    );
}
