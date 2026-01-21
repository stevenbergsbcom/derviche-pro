'use client';

import { Calendar, MapPin, Users, Clock } from 'lucide-react';
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

/**
 * Formate une date en français
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
}

/**
 * Formate une heure (HH:MM:SS -> HH:MM)
 */
function formatTime(timeString: string): string {
    return timeString.slice(0, 5);
}

/**
 * Calcule le pourcentage de remplissage
 */
function calculateOccupancy(reserved: number, capacity: number): number {
    // Capacité illimitée (999999)
    if (capacity === 999999 || capacity === 0) {
        return 0;
    }
    return Math.round((reserved / capacity) * 100);
}

/**
 * Retourne la couleur du badge selon le remplissage
 */
function getOccupancyVariant(percentage: number): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 70) return 'default';
    if (percentage >= 50) return 'secondary';
    return 'outline';
}

// ============================================
// COMPOSANT SKELETON
// ============================================

function SlotSkeleton() {
    return (
        <div className="p-4 border-b last:border-b-0 animate-pulse">
            <div className="flex justify-between items-start mb-2">
                <div className="h-5 w-48 bg-muted rounded" />
                <div className="h-5 w-16 bg-muted rounded" />
            </div>
            <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-4 w-40 bg-muted rounded" />
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
            <Card>
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
            <Card>
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-gold" />
                    Prochaines représentations
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {slots.map((slot) => {
                        const occupancy = calculateOccupancy(slot.reservations_count, slot.capacity);
                        const isUnlimited = slot.capacity === 999999;

                        return (
                            <div
                                key={slot.id}
                                className="p-4 hover:bg-muted/50 transition-colors"
                            >
                                {/* Titre du spectacle */}
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-derviche-dark line-clamp-1">
                                        {slot.show.title}
                                    </h4>
                                    {!isUnlimited && (
                                        <Badge variant={getOccupancyVariant(occupancy)}>
                                            {occupancy}%
                                        </Badge>
                                    )}
                                </div>

                                {/* Détails */}
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    {/* Date et heure */}
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>
                                            {formatDate(slot.date)} à {formatTime(slot.time)}
                                        </span>
                                    </div>

                                    {/* Lieu */}
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>
                                            {slot.venue.name}, {slot.venue.city}
                                        </span>
                                    </div>

                                    {/* Réservations */}
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span>
                                            {slot.reservations_count} réservation{slot.reservations_count > 1 ? 's' : ''}
                                            {!isUnlimited && ` / ${slot.capacity} places`}
                                            {isUnlimited && ' (capacité illimitée)'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
