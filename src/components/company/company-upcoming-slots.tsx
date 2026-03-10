'use client';

import { Calendar, MapPin, Users, Clock, Theater } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UpcomingSlot } from '@/lib/services/company-dashboard';

// ============================================
// TYPES
// ============================================

interface CompanyUpcomingSlotsProps {
    slots: UpcomingSlot[];
    isLoading?: boolean;
}

// ============================================
// UTILITAIRES
// ============================================

/** Formate une date locale en français (sans décalage UTC) */
function formatDate(dateString: string): string {
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y!, m! - 1, d!).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
}

/** Formate une heure (HH:MM:SS → HH:MM) */
function formatTime(timeString: string): string {
    return timeString.slice(0, 5);
}

// ============================================
// COMPOSANT SKELETON
// ============================================

function SlotSkeleton() {
    return (
        <div className="p-4 border-b last:border-b-0 animate-pulse space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                    <div className="h-4 w-48 bg-muted rounded" />
                    <div className="h-3 w-32 bg-muted rounded" />
                </div>
                <div className="h-6 w-16 bg-muted rounded-full" />
            </div>
            <div className="flex gap-4">
                <div className="h-3 w-28 bg-muted rounded" />
                <div className="h-3 w-36 bg-muted rounded" />
            </div>
        </div>
    );
}

// ============================================
// COMPOSANT SLOT
// ============================================

interface SlotItemProps {
    slot: UpcomingSlot;
}

function SlotItem({ slot }: SlotItemProps) {
    const hasCheckin = slot.checkin_count > 0;
    const checkinPercent = slot.reservations_count > 0
        ? Math.round((slot.checkin_count / slot.reservations_count) * 100)
        : 0;

    return (
        <div className="p-4 hover:bg-muted/40 transition-colors group">
            {/* Ligne 1 : titre + badge inscrits */}
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Theater className="w-3.5 h-3.5 shrink-0 text-gold" />
                    <h4 className="font-medium text-derviche-dark text-sm line-clamp-1">
                        {slot.show.title}
                    </h4>
                </div>
                <Badge
                    variant="secondary"
                    className="shrink-0 text-xs flex items-center gap-1 bg-derviche/8 text-derviche border-0"
                >
                    <Users className="w-3 h-3" />
                    {slot.reservations_count} inscrit{slot.reservations_count > 1 ? 's' : ''}
                </Badge>
            </div>

            {/* Ligne 2 : date + lieu en ligne */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-derviche/50" />
                    <span className="capitalize">{formatDate(slot.date)}</span>
                    <span className="text-derviche/40">·</span>
                    <span className="font-medium text-derviche/70">{formatTime(slot.time)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-derviche/50" />
                    {slot.venue.name}, {slot.venue.city}
                </span>
            </div>

            {/* Barre de présence — uniquement si checkin commencé */}
            {hasCheckin && (
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-green-700">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                            {slot.checkin_count} présent{slot.checkin_count > 1 ? 's' : ''}
                        </span>
                        <span className="text-muted-foreground">
                            {checkinPercent}% sur {slot.reservations_count}
                        </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${checkinPercent}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function CompanyUpcomingSlots({ slots, isLoading = false }: CompanyUpcomingSlotsProps) {
    const header = (
        <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-4 h-4 text-gold" />
                Prochaines représentations
                {!isLoading && slots.length > 0 && (
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                        {slots.length} à venir
                    </span>
                )}
            </CardTitle>
        </CardHeader>
    );

    if (isLoading) {
        return (
            <Card className="pt-5 gap-3">
                {header}
                <CardContent className="p-0">
                    <SlotSkeleton />
                    <SlotSkeleton />
                    <SlotSkeleton />
                </CardContent>
            </Card>
        );
    }

    if (slots.length === 0) {
        return (
            <Card className="pt-5 gap-3">
                {header}
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Calendar className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">
                            Aucune représentation à venir
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="pt-5 gap-3">
            {header}
            <CardContent className="p-0">
                <div className="divide-y divide-border/60">
                    {slots.map((slot) => (
                        <SlotItem key={slot.id} slot={slot} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
