'use client';

import { useEffect } from 'react';
import {
    Calendar,
    MapPin,
    Users,
    Flame,
    CalendarDays,
    CalendarClock,
    Drama,
    AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { UpcomingSlot } from '@/lib/services/company-dashboard';
import { formatTimeShort } from '@/lib/utils/format-date';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface CompanyUpcomingSlotsProps {
    /** Créneaux à venir (fetchés au mount). */
    slots: UpcomingSlot[];
    isLoading?: boolean;
    /** Créneaux passés (null tant que non chargés). */
    pastSlots: UpcomingSlot[] | null;
    isPastLoading?: boolean;
    pastError?: string | null;
    /** Callback lazy pour déclencher le fetch des passées au premier toggle. */
    onLoadPastSlots: () => void;
    /** Bascule entre « à venir » et « passées » (contrôlé par le parent). */
    showPast: boolean;
    onShowPastChange: (showPast: boolean) => void;
}

// ============================================
// UTILITAIRES DATE & URGENCE
// ============================================

function formatDateShort(dateString: string): string {
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y!, m! - 1, d!).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

type UrgencyLevel = 'urgent' | 'thisWeek' | 'later';

/** Détermine l'urgence temporelle (futur uniquement).
 *  Pour les créneaux passés, on renvoie toujours `later` (gris) — pas
 *  d'urgence sur du passé. */
function getUrgencyLevel(slot: UpcomingSlot, isPast: boolean): UrgencyLevel {
    if (isPast) return 'later';
    const [y, m, d] = slot.date.split('-').map(Number);
    const slotDate = new Date(y!, m! - 1, d!);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysDiff = Math.floor(
        (slotDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff <= 1) return 'urgent';
    if (daysDiff <= 7) return 'thisWeek';
    return 'later';
}

const URGENCY_CONFIG: Record<
    UrgencyLevel,
    { icon: typeof Flame; className: string; tooltip: string }
> = {
    urgent: {
        icon: Flame,
        className: 'bg-red-100 text-red-700',
        tooltip: "Aujourd'hui ou demain",
    },
    thisWeek: {
        icon: CalendarDays,
        className: 'bg-blue-100 text-blue-700',
        tooltip: 'Cette semaine',
    },
    later: {
        icon: CalendarClock,
        className: 'bg-gray-100 text-gray-600',
        tooltip: 'Plus tard',
    },
};

// ============================================
// SKELETON
// ============================================

function SlotRowSkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-56 bg-muted rounded" />
                <div className="h-3 w-40 bg-muted rounded" />
            </div>
            <div className="h-5 w-20 bg-muted rounded-full shrink-0" />
        </div>
    );
}

// ============================================
// LIGNE DE SLOT (dense horizontal)
// ============================================

interface SlotRowProps {
    slot: UpcomingSlot;
    isPast: boolean;
}

function SlotRow({ slot, isPast }: SlotRowProps) {
    const urgency = getUrgencyLevel(slot, isPast);
    const urgencyConfig = URGENCY_CONFIG[urgency];
    const UrgencyIcon = urgencyConfig.icon;

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors group">
            {/* Pastille d'urgence */}
            <div
                className={cn(
                    'shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
                    urgencyConfig.className,
                )}
                title={urgencyConfig.tooltip}
                aria-label={urgencyConfig.tooltip}
            >
                <UrgencyIcon className="w-3.5 h-3.5" aria-hidden="true" />
            </div>

            {/* Contenu : date · titre · lieu — une seule ligne, wrap sur écran étroit */}
            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
                <span className="font-medium text-derviche-dark capitalize whitespace-nowrap">
                    {formatDateShort(slot.date)}
                    <span className="text-derviche/40 mx-1">·</span>
                    <span className="tabular-nums">{formatTimeShort(slot.time)}</span>
                </span>
                <span className="flex items-center gap-1.5 text-foreground min-w-0">
                    <Drama className="w-3.5 h-3.5 shrink-0 text-gold" aria-hidden="true" />
                    <span className="truncate">{slot.show.title}</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                    <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                        {slot.venue.name}
                        {slot.venue.city && `, ${slot.venue.city}`}
                    </span>
                </span>
            </div>

            {/* Compteurs à droite : inscrits + présents (si commencé) */}
            <div className="shrink-0 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-derviche/8 text-derviche">
                    <Users className="w-3 h-3" aria-hidden="true" />
                    {slot.reservations_count} inscrit
                    {slot.reservations_count > 1 ? 's' : ''}
                </span>
                {slot.checkin_count > 0 && (
                    <span className="inline-flex items-center gap-1 text-green-700 font-medium whitespace-nowrap">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                        {slot.checkin_count} présent
                        {slot.checkin_count > 1 ? 's' : ''}
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function CompanyUpcomingSlots({
    slots,
    isLoading = false,
    pastSlots,
    isPastLoading = false,
    pastError = null,
    onLoadPastSlots,
    showPast,
    onShowPastChange,
}: CompanyUpcomingSlotsProps) {
    // Déclenche le fetch lazy dès que le switch passe sur « passées » pour la
    // première fois. Le hook gère le cache (pas de refetch si déjà chargé).
    useEffect(() => {
        if (showPast) {
            onLoadPastSlots();
        }
    }, [showPast, onLoadPastSlots]);

    const displayedSlots = showPast ? pastSlots ?? [] : slots;
    // Flash vide évité (audit Cursor C2) : tant que `pastSlots === null` et
    // qu'aucune erreur n'est remontée, on considère qu'on est en chargement
    // (le useEffect ci-dessus va déclencher le fetch lazy dans le même tick).
    const displayedIsLoading = showPast
        ? isPastLoading || (pastSlots === null && !pastError)
        : isLoading;
    const displayedError = showPast ? pastError : null;
    const displayedCount = displayedSlots.length;

    const header = (
        <CardHeader className="pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-4 h-4 text-gold" aria-hidden="true" />
                    {showPast ? 'Représentations passées' : 'Prochaines représentations'}
                    {!displayedIsLoading && displayedSlots.length > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">
                            ({displayedCount})
                        </span>
                    )}
                </CardTitle>

                {/* Switch : voir les passées */}
                <div className="flex items-center gap-2">
                    <Switch
                        id="show-past-slots"
                        checked={showPast}
                        onCheckedChange={onShowPastChange}
                    />
                    <Label
                        htmlFor="show-past-slots"
                        className="text-sm text-muted-foreground cursor-pointer"
                    >
                        Voir les passées
                    </Label>
                </div>
            </div>
        </CardHeader>
    );

    if (displayedIsLoading) {
        return (
            <Card className="pt-5 gap-3">
                {header}
                <CardContent className="p-0">
                    <SlotRowSkeleton />
                    <SlotRowSkeleton />
                    <SlotRowSkeleton />
                </CardContent>
            </Card>
        );
    }

    if (displayedError) {
        return (
            <Card className="pt-5 gap-3">
                {header}
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <AlertTriangle
                            className="w-8 h-8 text-destructive/60 mb-2"
                            aria-hidden="true"
                        />
                        <p className="text-sm text-destructive">{displayedError}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (displayedSlots.length === 0) {
        return (
            <Card className="pt-5 gap-3">
                {header}
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Calendar
                            className="w-8 h-8 text-muted-foreground/30 mb-2"
                            aria-hidden="true"
                        />
                        <p className="text-sm text-muted-foreground">
                            {showPast
                                ? 'Aucune représentation passée'
                                : 'Aucune représentation à venir'}
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
                {/* aria-live polite : annonce le changement de liste
                    (passées ↔ à venir) et le nouveau compte au lecteur
                    d'écran — audit Cursor E2. */}
                <div
                    className="divide-y divide-border/60"
                    aria-live="polite"
                    aria-atomic="false"
                >
                    <span className="sr-only">
                        {showPast ? 'Représentations passées' : 'Prochaines représentations'}
                        {` : ${displayedCount} résultat${displayedCount > 1 ? 's' : ''}`}
                    </span>
                    {displayedSlots.map((slot) => (
                        <SlotRow key={slot.id} slot={slot} isPast={showPast} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
