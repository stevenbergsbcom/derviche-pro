'use client';

import { Film, Calendar, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { CompanyDashboardStats } from '@/lib/services/company-dashboard';

// ============================================
// TYPES
// ============================================

interface CompanyStatsCardsProps {
    stats: CompanyDashboardStats;
    isLoading?: boolean;
}

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    isLoading?: boolean;
}

// ============================================
// COMPOSANT CARTE INDIVIDUELLE
// ============================================

function StatCard({ label, value, icon: Icon, description, isLoading }: StatCardProps) {
    return (
        <Card className="bg-white">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        {isLoading ? (
                            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                        ) : (
                            <p className="text-3xl font-bold text-derviche-dark">{value}</p>
                        )}
                        {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        )}
                    </div>
                    <div className="p-3 bg-gold/10 rounded-lg">
                        <Icon className="w-6 h-6 text-gold" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function CompanyStatsCards({ stats, isLoading = false }: CompanyStatsCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                label="Spectacles"
                value={stats.total_shows}
                icon={Film}
                description="Total de vos spectacles"
                isLoading={isLoading}
            />
            <StatCard
                label="Représentations"
                value={stats.total_slots}
                icon={Calendar}
                description={`${stats.upcoming_slots_count} à venir`}
                isLoading={isLoading}
            />
            <StatCard
                label="Réservations"
                value={stats.total_reservations}
                icon={Users}
                description="Places réservées (confirmées)"
                isLoading={isLoading}
            />
            <StatCard
                label="Taux de remplissage"
                value={`${stats.average_occupancy_rate}%`}
                icon={TrendingUp}
                description="Moyenne sur tous les créneaux"
                isLoading={isLoading}
            />
        </div>
    );
}
