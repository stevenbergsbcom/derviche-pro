'use client';

import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <div className="p-4 border-b last:border-b-0 animate-pulse">
            <div className="flex justify-between items-start mb-2">
                <div className="h-5 w-48 bg-muted rounded" />
            </div>
            <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-4 w-36 bg-muted rounded" />
            </div>
        </div>
    );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function CompanyUpcomingSlots({ slots, isLoading = false }: CompanyUpcomingSlotsProps) {
    if (isLoading) {
        return (
            <Card className="py-5 gap-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="w-5 h-5 text-gold" />
                        Prochaines représentations
                    </CardTitle>
                </CardHeader>
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
            <Card className="py-5 gap-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="w-5 h-5 text-gold" />
                        Prochaines représentations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Aucune représentation à venir
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="py-5 gap-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-gold" />
                    Prochaines représentations
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {slots.map((slot) => (
                        <div
                            key={slot.id}
                            className="p-4 hover:bg-muted/50 transition-colors"
                        >
                            {/* Titre du spectacle */}
                            <h4 className="font-medium text-derviche-dark line-clamp-1 mb-2">
                                {slot.show.title}
                            </h4>

                            {/* Détails */}
                            <div className="space-y-1 text-sm text-muted-foreground">
                                {/* Date et heure */}
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 shrink-0" />
                                    <span>
                                        {formatDate(slot.date)} à {formatTime(slot.time)}
                                    </span>
                                </div>

                                {/* Lieu */}
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span>
                                        {slot.venue.name}, {slot.venue.city}
                                    </span>
                                </div>

                                {/* Inscrits */}
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 shrink-0" />
                                    <span>
                                        {slot.reservations_count} inscrit{slot.reservations_count > 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Barre présents / inscrits (uniquement si checkin déjà commencé) */}
                                {slot.checkin_count > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-green-700 font-medium">
                                                {slot.checkin_count} présent{slot.checkin_count > 1 ? 's' : ''}
                                            </span>
                                            <span className="text-muted-foreground">
                                                sur {slot.reservations_count} inscrit{slot.reservations_count > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full transition-all"
                                                style={{
                                                    width: slot.reservations_count > 0
                                                        ? `${Math.round((slot.checkin_count / slot.reservations_count) * 100)}%`
                                                        : '0%',
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
