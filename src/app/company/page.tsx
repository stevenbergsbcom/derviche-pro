'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useCompanyDashboard } from '@/hooks';
import { CompanyStatsCards, CompanyUpcomingSlots } from '@/components/company';
import type { CompanyShowWithStats } from '@/lib/services/company-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Film, ArrowRight, Drama } from 'lucide-react';
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
// COMPOSANT LISTE DES SPECTACLES (grille 2 colonnes desktop)
// Chaque spectacle = mini-card avec miniature + compteurs + badge statut
// + alerte visuelle si aucun créneau à venir (S198 UX)
// ============================================

interface ShowsListProps {
    shows: CompanyShowWithStats[] | undefined;
    isLoading: boolean;
}

function getStatusBadge(status: string): { label: string; className: string } {
    switch (status) {
        case 'published':
            return { label: 'Publié', className: 'bg-green-100 text-green-700 border-green-200' };
        case 'draft':
            return { label: 'Brouillon', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
        default:
            return { label: 'Archivé', className: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
}

function ShowMiniCard({ show }: { show: CompanyShowWithStats }) {
    const hasImage = !!show.image_url && !show.image_url.includes('placeholder');
    const status = getStatusBadge(show.status);
    const hasActivity = show.total_slots > 0 || show.total_reservations > 0;

    return (
        <div className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors">
            {/* Miniature */}
            <div className="shrink-0 w-14 h-14 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                {hasImage ? (
                    <Image
                        src={show.image_url as string}
                        alt=""
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Drama className="w-5 h-5 text-muted-foreground/60" aria-hidden="true" />
                )}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm text-derviche-dark truncate">
                        {show.title}
                    </h4>
                    <span
                        className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${status.className}`}
                    >
                        {status.label}
                    </span>
                </div>

                {hasActivity ? (
                    <p className="text-xs text-muted-foreground mt-1">
                        {show.total_slots} repré{show.total_slots > 1 ? 's' : ''} · {show.total_reservations} résa{show.total_reservations > 1 ? 's' : ''}
                    </p>
                ) : (
                    <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                        Aucune date planifiée
                    </p>
                )}
            </div>
        </div>
    );
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
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className="flex gap-3 p-3 rounded-lg border animate-pulse"
                            >
                                <div className="w-14 h-14 bg-muted rounded-md shrink-0" />
                                <div className="flex-1 space-y-2 pt-1">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-3 w-40 bg-muted rounded" />
                                </div>
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

    const displayedShows = shows.slice(0, 6);

    return (
        <Card className="py-5 gap-3">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg text-derviche-dark">
                        <Film className="w-5 h-5 text-gold" />
                        Mes spectacles
                    </CardTitle>
                    {shows.length > 6 && (
                        <Link href="/company/spectacles">
                            <Button variant="ghost" size="sm" className="gap-1 text-xs text-gold hover:text-gold/80">
                                Voir tous
                                <ArrowRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {/* Grille 2 colonnes desktop, 1 colonne mobile */}
                <div className="grid gap-3 sm:grid-cols-2">
                    {displayedShows.map((show) => (
                        <ShowMiniCard key={show.id} show={show} />
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
    const {
        data,
        isLoading,
        error,
        refresh,
        pastSlots,
        isPastLoading,
        pastError,
        loadPastSlots,
    } = useCompanyDashboard();

    /** Bascule de la section Représentations : false = à venir, true = passées. */
    const [showPast, setShowPast] = useState(false);

    /** Wrapper stable pour éviter de re-déclencher le `useEffect` lazy
     *  du composant à chaque rendu (audit Cursor D2). Le cache du hook
     *  rend les appels supplémentaires no-op, mais on évite le bruit. */
    const handleLoadPastSlots = useCallback(() => {
        void loadPastSlots();
    }, [loadPastSlots]);

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

            {/* Représentations (à venir par défaut, switch pour voir les passées)
                — pleine largeur, peut être très long */}
            <CompanyUpcomingSlots
                slots={data?.upcomingSlots || []}
                isLoading={isLoading}
                pastSlots={pastSlots}
                isPastLoading={isPastLoading}
                pastError={pastError}
                onLoadPastSlots={handleLoadPastSlots}
                showPast={showPast}
                onShowPastChange={setShowPast}
            />
        </div>
    );
}
