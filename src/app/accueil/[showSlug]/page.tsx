/**
 * Page Représentations d'un spectacle - Check-in Mobile
 * Derviche Diffusion
 * 
 * Affiche les représentations d'un spectacle groupées par date
 * Interface mobile-first optimisée pour l'accueil sur place
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCheckinAccess } from '@/hooks';
import {
  formatSlotDate,
  isSlotToday,
  groupSlotsByDate,
} from '@/lib/services/checkin';
import { SlotCard, SlotCardSkeleton } from '@/components/accueil';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Loader2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Theater,
} from 'lucide-react';

// ============================================
// COMPOSANTS
// ============================================

/** En-tête du spectacle */
function ShowHeader({
  title,
  slotsCount,
  isLoading,
}: {
  title: string;
  slotsCount: number;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white border-b px-4 py-4">
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ) : (
        <>
          <h2 className="text-lg font-bold text-derviche-dark line-clamp-2">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {slotsCount} représentation{slotsCount > 1 ? 's' : ''} à venir
          </p>
        </>
      )}
    </div>
  );
}

/** État vide */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Theater className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h2 className="text-lg font-semibold text-derviche-dark mb-2">
        Aucune représentation
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Ce spectacle n&apos;a pas de représentation à venir accessible.
      </p>
    </div>
  );
}

/** État erreur */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold text-derviche-dark mb-2">
        Erreur de chargement
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{message}</p>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Réessayer
      </Button>
    </div>
  );
}

/** Section de date avec slots */
function DateSection({
  date,
  slots,
  onSlotClick,
}: {
  date: string;
  slots: {
    id: string;
    date: string;
    time: string;
    capacity: number;
    remainingCapacity: number;
    hostedBy: 'derviche' | 'company' | 'externe';
    hostedById: string | null;
    venue: { id: string; name: string; city: string };
    show: { id: string; slug: string; title: string };
    confirmedCount: number;
    checkedInCount: number;
  }[];
  onSlotClick: (slotId: string) => void;
}) {
  const isToday = isSlotToday(date);

  return (
    <section>
      <h3
        className={`text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${
          isToday ? 'text-gold' : 'text-muted-foreground'
        }`}
      >
        <Calendar className="w-4 h-4" />
        {isToday ? "Aujourd'hui" : formatSlotDate(date)}
      </h3>
      <div className="space-y-4">
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            onClick={() => onSlotClick(slot.id)}
          />
        ))}
      </div>
    </section>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function ShowSlotsPage() {
  const router = useRouter();
  const params = useParams();
  const showSlug = params.showSlug as string;

  const { slots, isLoadingSlots, slotsError, loadSlots, shows, isAuthLoading, role } =
    useCheckinAccess();

  // Ref pour éviter les appels multiples
  const loadedSlugRef = useRef<string | null>(null);

  // Charger les slots au montage (une fois auth prête)
  useEffect(() => {
    if (!isAuthLoading && role && showSlug && loadedSlugRef.current !== showSlug) {
      loadedSlugRef.current = showSlug;
      void loadSlots(showSlug);
    }
  }, [isAuthLoading, role, showSlug, loadSlots]);

  // Handler refresh manuel
  const handleRefresh = useCallback(() => {
    loadedSlugRef.current = null;
    void loadSlots(showSlug);
  }, [showSlug, loadSlots]);

  // Handler navigation vers slot
  const handleSlotClick = useCallback(
    (slotId: string) => {
      router.push(`/accueil/${showSlug}/${slotId}`);
    },
    [router, showSlug]
  );

  // Trouver le titre du spectacle
  const showTitle =
    slots.length > 0
      ? slots[0].show.title
      : shows.find((s) => s.slug === showSlug)?.title || 'Spectacle';

  // Grouper les slots par date
  const groupedSlots = groupSlotsByDate(slots);

  // Séparer aujourd'hui des autres dates
  const today = new Date().toISOString().split('T')[0];
  const todaySlots = groupedSlots.get(today);
  const otherDates = Array.from(groupedSlots.entries()).filter(
    ([date]) => date !== today
  );

  return (
    <div className="pb-6">
      {/* En-tête */}
      <ShowHeader
        title={showTitle}
        slotsCount={slots.length}
        isLoading={isLoadingSlots && slots.length === 0}
      />

      {/* Contenu */}
      <div className="px-4 pt-4 space-y-6">
        {/* Chargement initial */}
        {isLoadingSlots && slots.length === 0 && (
          <div className="space-y-4">
            <SlotCardSkeleton />
            <SlotCardSkeleton />
            <SlotCardSkeleton />
          </div>
        )}

        {/* Erreur */}
        {!isLoadingSlots && slotsError && (
          <ErrorState message={slotsError} onRetry={handleRefresh} />
        )}

        {/* Liste vide */}
        {!isLoadingSlots && !slotsError && slots.length === 0 && <EmptyState />}

        {/* Slots aujourd'hui */}
        {!isLoadingSlots && !slotsError && todaySlots && todaySlots.length > 0 && (
          <DateSection
            date={today}
            slots={todaySlots}
            onSlotClick={handleSlotClick}
          />
        )}

        {/* Autres dates */}
        {!isLoadingSlots &&
          !slotsError &&
          otherDates.map(([date, dateSlots]) => (
            <DateSection
              key={date}
              date={date}
              slots={dateSlots}
              onSlotClick={handleSlotClick}
            />
          ))}

        {/* Bouton actualiser */}
        {!isLoadingSlots && !slotsError && slots.length > 0 && (
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        )}
      </div>

      {/* Indicateur de chargement overlay */}
      {isLoadingSlots && slots.length > 0 && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        </div>
      )}
    </div>
  );
}
