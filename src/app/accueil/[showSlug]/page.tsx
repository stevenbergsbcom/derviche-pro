/**
 * Page Représentations d'un spectacle - Check-in Mobile
 * Derviche Diffusion
 * 
 * Affiche les représentations d'un spectacle groupées par date
 * Interface mobile-first optimisée pour l'accueil sur place
 * Onglets "À venir" / "Passés" pour filtrer les créneaux
 */

'use client';

import { useMemo } from 'react';
import { History, RefreshCw, Theater } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SlotCardSkeleton } from '@/components/accueil';
import { useShowSlots, DEFAULT_PAST_DAYS_LIMIT } from './hooks/useShowSlots';
import { EmptyState, ErrorState, LoadingOverlay } from '@/components/pwa';
import {
  TabFilters,
  ShowHeader,
  DateSection,
} from './components';

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function ShowSlotsPage() {
  const {
    // États
    activeTab,
    showFullHistory,
    isLoading,
    error,
    // Données
    showTitle,
    showImageUrl,
    displayedSlots,
    upcomingSlots,
    pastSlots,
    todaySlots,
    otherDates,
    hasSlots,
    // Handlers
    setActiveTab,
    handleRefresh,
    handleLoadFullHistory,
    handleSlotClick,
  } = useShowSlots();

  // Date d'aujourd'hui pour la section spéciale (mémorisée)
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Flags pour simplifier les conditions
  const isInitialLoading = isLoading && !hasSlots;
  const showTabFilters = !isLoading && !error && hasSlots;
  const showTodaySection = !isLoading && !error && todaySlots && todaySlots.length > 0;
  const showHistoryButton = !isLoading && !error && activeTab === 'past' && !showFullHistory && pastSlots.length > 0;
  const showRefreshButton = !isLoading && !error && hasSlots;

  return (
    <div className="pb-6">
      {/* En-tête */}
      <ShowHeader
        title={showTitle}
        imageUrl={showImageUrl}
        slotsCount={displayedSlots.length}
        isLoading={isInitialLoading}
        activeTab={activeTab}
        showFullHistory={showFullHistory}
        pastDaysLimit={DEFAULT_PAST_DAYS_LIMIT}
      />

      {/* Onglets de filtrage */}
      {showTabFilters && (
        <TabFilters
          activeTab={activeTab}
          onTabChange={setActiveTab}
          upcomingCount={upcomingSlots.length}
          pastCount={pastSlots.length}
        />
      )}

      {/* Contenu principal */}
      <main 
        id="slots-panel" 
        role="tabpanel"
        aria-label={`Représentations ${activeTab === 'upcoming' ? 'à venir' : 'passées'}`}
        className="px-4 pt-4 space-y-6"
      >
        {/* Chargement initial */}
        {isInitialLoading && (
          <div className="space-y-4" aria-busy="true">
            <SlotCardSkeleton />
            <SlotCardSkeleton />
            <SlotCardSkeleton />
          </div>
        )}

        {/* Erreur */}
        {!isLoading && error && (
          <ErrorState message={error} onRetry={handleRefresh} />
        )}

        {/* Liste vide */}
        {!isLoading && !error && displayedSlots.length === 0 && (
          <EmptyState
            icon={activeTab === 'upcoming' ? Theater : History}
            title={activeTab === 'upcoming' ? 'Aucune représentation à venir' : 'Aucune représentation passée'}
            message={
              activeTab === 'upcoming'
                ? "Ce spectacle n'a pas de représentation à venir accessible."
                : "Ce spectacle n'a pas encore eu de représentation."
            }
          />
        )}

        {/* Slots aujourd'hui (uniquement pour l'onglet "À venir") */}
        {showTodaySection && (
          <DateSection
            date={today}
            slots={todaySlots}
            onSlotClick={handleSlotClick}
          />
        )}

        {/* Autres dates */}
        {!isLoading && !error && otherDates.map(([date, dateSlots]) => (
          <DateSection
            key={date}
            date={date}
            slots={dateSlots}
            onSlotClick={handleSlotClick}
            isPast={activeTab === 'past'}
          />
        ))}

        {/* Bouton "Voir tout l'historique" - uniquement pour l'onglet Passés */}
        {showHistoryButton && (
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleLoadFullHistory()}
              className="w-full text-muted-foreground hover:text-derviche-dark"
              aria-label="Charger l'historique complet des représentations passées"
            >
              <History className="w-4 h-4 mr-2" aria-hidden="true" />
              Voir tout l&apos;historique
            </Button>
          </div>
        )}

        {/* Bouton actualiser */}
        {showRefreshButton && (
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="w-full"
              aria-label="Actualiser la liste des représentations"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              Actualiser
            </Button>
          </div>
        )}
      </main>

      {/* Indicateur de chargement overlay */}
      <LoadingOverlay visible={isLoading && hasSlots} />
    </div>
  );
}
