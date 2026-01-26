/**
 * Page Représentations d'un spectacle - Check-in Mobile
 * Derviche Diffusion
 * 
 * Affiche les représentations d'un spectacle groupées par date
 * Interface mobile-first optimisée pour l'accueil sur place
 * Onglets "À venir" / "Passés" pour filtrer les créneaux
 */

'use client';

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCheckinAccess, DEFAULT_PAST_DAYS_LIMIT } from '@/hooks';
import {
  formatSlotDate,
  isSlotToday,
  isSlotPast,
  groupSlotsByDate,
  type CheckinSlot,
} from '@/lib/services/checkin';
import { SlotCard, SlotCardSkeleton } from '@/components/accueil';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Theater,
  History,
  CalendarDays,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type TabFilter = 'upcoming' | 'past';

// ============================================
// COMPOSANTS
// ============================================

/** Onglets de filtrage */
function TabFilters({
  activeTab,
  onTabChange,
  upcomingCount,
  pastCount,
}: {
  activeTab: TabFilter;
  onTabChange: (tab: TabFilter) => void;
  upcomingCount: number;
  pastCount: number;
}) {
  return (
    <div className="flex gap-2 px-4 py-3 bg-white border-b">
      <button
        type="button"
        onClick={() => onTabChange('upcoming')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-base font-medium transition-colors',
          activeTab === 'upcoming'
            ? 'bg-derviche-dark text-white'
            : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
        )}
      >
        <CalendarDays className="w-4 h-4" />
        À venir
        {upcomingCount > 0 && (
          <span className={cn(
            'px-1.5 py-0.5 text-sm rounded-full',
            activeTab === 'upcoming' 
              ? 'bg-white/20 text-white' 
              : 'bg-gray-200 text-muted-foreground'
          )}>
            {upcomingCount}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onTabChange('past')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-base font-medium transition-colors',
          activeTab === 'past'
            ? 'bg-derviche-dark text-white'
            : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
        )}
      >
        <History className="w-4 h-4" />
        Passés
        {pastCount > 0 && (
          <span className={cn(
            'px-1.5 py-0.5 text-sm rounded-full',
            activeTab === 'past' 
              ? 'bg-white/20 text-white' 
              : 'bg-gray-200 text-muted-foreground'
          )}>
            {pastCount}
          </span>
        )}
      </button>
    </div>
  );
}

/** En-tête du spectacle */
function ShowHeader({
  title,
  slotsCount,
  isLoading,
  activeTab,
  showFullHistory,
}: {
  title: string;
  slotsCount: number;
  isLoading: boolean;
  activeTab: TabFilter;
  showFullHistory: boolean;
}) {
  let label: string;
  
  if (activeTab === 'upcoming') {
    label = `${slotsCount} représentation${slotsCount > 1 ? 's' : ''} à venir`;
  } else {
    const suffix = showFullHistory 
      ? '(historique complet)' 
      : `(${DEFAULT_PAST_DAYS_LIMIT} derniers jours)`;
    label = `${slotsCount} représentation${slotsCount > 1 ? 's' : ''} passée${slotsCount > 1 ? 's' : ''} ${suffix}`;
  }

  return (
    <div className="bg-white border-b px-4 py-4">
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-derviche-dark line-clamp-2">
            {title}
          </h2>
          <p className="text-base text-muted-foreground mt-0.5">
            {label}
          </p>
        </>
      )}
    </div>
  );
}

/** État vide */
function EmptyState({ activeTab }: { activeTab: TabFilter }) {
  const isUpcoming = activeTab === 'upcoming';
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        {isUpcoming ? (
          <Theater className="w-8 h-8 text-muted-foreground/50" />
        ) : (
          <History className="w-8 h-8 text-muted-foreground/50" />
        )}
      </div>
      <h2 className="text-xl font-semibold text-derviche-dark mb-2">
        {isUpcoming ? 'Aucune représentation à venir' : 'Aucune représentation passée'}
      </h2>
      <p className="text-base text-muted-foreground max-w-xs">
        {isUpcoming 
          ? "Ce spectacle n'a pas de représentation à venir accessible."
          : "Ce spectacle n'a pas encore eu de représentation."
        }
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
      <h2 className="text-xl font-semibold text-derviche-dark mb-2">
        Erreur de chargement
      </h2>
      <p className="text-base text-muted-foreground max-w-xs mb-4">{message}</p>
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
  isPast,
}: {
  date: string;
  slots: CheckinSlot[];
  onSlotClick: (slotId: string) => void;
  isPast?: boolean;
}) {
  const isToday = isSlotToday(date);

  return (
    <section>
      <h3
        className={cn(
          'text-base font-semibold uppercase tracking-wide mb-3 flex items-center gap-2',
          isToday ? 'text-gold' : isPast ? 'text-muted-foreground/70' : 'text-muted-foreground'
        )}
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

  // État pour l'onglet actif
  const [activeTab, setActiveTab] = useState<TabFilter>('upcoming');

  // État pour afficher tout l'historique (slots passés)
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Ref pour éviter les appels multiples
  const loadedSlugRef = useRef<string | null>(null);
  
  // Ref pour tracker si on a chargé l'historique complet
  const loadedFullHistoryRef = useRef(false);

  // Charger les slots au montage (une fois auth prête)
  useEffect(() => {
    if (!isAuthLoading && role && showSlug && loadedSlugRef.current !== showSlug) {
      loadedSlugRef.current = showSlug;
      loadedFullHistoryRef.current = false;
      setShowFullHistory(false);
      // Chargement initial : slots à venir + 30 derniers jours passés
      void loadSlots(showSlug, { includeAllPast: false });
    }
  }, [isAuthLoading, role, showSlug, loadSlots]);

  // Handler refresh manuel
  const handleRefresh = useCallback(() => {
    loadedSlugRef.current = null;
    // Garder l'état showFullHistory lors du refresh
    void loadSlots(showSlug, { includeAllPast: showFullHistory });
    loadedSlugRef.current = showSlug;
  }, [showSlug, loadSlots, showFullHistory]);

  // Handler pour charger tout l'historique
  const handleLoadFullHistory = useCallback(async () => {
    if (loadedFullHistoryRef.current) return; // Déjà chargé
    
    setShowFullHistory(true);
    
    try {
      await loadSlots(showSlug, { includeAllPast: true });
      // Marquer comme chargé uniquement en cas de succès
      loadedFullHistoryRef.current = true;
    } catch {
      // En cas d'erreur, permettre un retry
      setShowFullHistory(false);
      // L'erreur est déjà gérée par loadSlots (setSlotsError)
    }
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

  // Séparer les slots en "à venir" et "passés"
  const { upcomingSlots, pastSlots } = useMemo(() => {
    const upcoming: CheckinSlot[] = [];
    const past: CheckinSlot[] = [];

    for (const slot of slots) {
      if (isSlotPast(slot.date)) {
        past.push(slot);
      } else {
        upcoming.push(slot);
      }
    }

    // Trier les slots passés du plus récent au plus ancien
    past.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime(); // Ordre décroissant
    });

    return { upcomingSlots: upcoming, pastSlots: past };
  }, [slots]);

  // Slots affichés selon l'onglet
  const displayedSlots = activeTab === 'upcoming' ? upcomingSlots : pastSlots;

  // Grouper les slots affichés par date
  const groupedSlots = groupSlotsByDate(displayedSlots);

  // Pour l'onglet "À venir", séparer aujourd'hui des autres dates
  const today = new Date().toISOString().split('T')[0];
  const todaySlots = activeTab === 'upcoming' ? groupedSlots.get(today) : undefined;
  const otherDates = Array.from(groupedSlots.entries()).filter(
    ([date]) => activeTab === 'past' || date !== today
  );

  // Pour l'onglet "Passés", trier les dates du plus récent au plus ancien
  if (activeTab === 'past') {
    otherDates.sort((a, b) => b[0].localeCompare(a[0]));
  }

  return (
    <div className="pb-6">
      {/* En-tête */}
      <ShowHeader
        title={showTitle}
        slotsCount={displayedSlots.length}
        isLoading={isLoadingSlots && slots.length === 0}
        activeTab={activeTab}
        showFullHistory={showFullHistory}
      />

      {/* Onglets de filtrage */}
      {!isLoadingSlots && !slotsError && slots.length > 0 && (
        <TabFilters
          activeTab={activeTab}
          onTabChange={setActiveTab}
          upcomingCount={upcomingSlots.length}
          pastCount={pastSlots.length}
        />
      )}

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
        {!isLoadingSlots && !slotsError && displayedSlots.length === 0 && (
          <EmptyState activeTab={activeTab} />
        )}

        {/* Slots aujourd'hui (uniquement pour l'onglet "À venir") */}
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
              isPast={activeTab === 'past'}
            />
          ))}

        {/* Bouton "Voir tout l'historique" - uniquement pour l'onglet Passés */}
        {!isLoadingSlots && 
          !slotsError && 
          activeTab === 'past' && 
          !showFullHistory && 
          pastSlots.length > 0 && (
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadFullHistory}
              className="w-full text-muted-foreground hover:text-derviche-dark"
            >
              <History className="w-4 h-4 mr-2" />
              Voir tout l&apos;historique
            </Button>
          </div>
        )}

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
