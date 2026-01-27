/**
 * Page Accueil - Liste des spectacles
 * Derviche Diffusion - PWA Check-in
 * 
 * Orchestrateur simplifié utilisant :
 * - useCheckinAccess : fetch des données
 * - useShowsFiltering : logique de filtrage
 * - Composants extraits : UI
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCheckinAccess } from '@/hooks';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useShowsFiltering } from './hooks/useShowsFiltering';
import { Theater } from 'lucide-react';
import { EmptyState, ErrorState, LoadingOverlay } from '@/components/pwa';
import {
  ShowCardSkeleton,
  HeaderSection,
  TabFilters,
  ShowsList,
  EmptyTabMessage,
} from './components';
import { isShowListItem } from './types';

export default function AccueilPage() {
  const router = useRouter();

  // Hook de données (fetch depuis useCheckinAccess)
  const {
    shows,
    isLoadingShows,
    showsError,
    isAdmin,
    companyName,
    role,
    loadShows,
  } = useCheckinAccess();

  // Validation des shows avec type guard (sécurise les données Supabase)
  const validShows = useMemo(
    () => shows.filter(isShowListItem),
    [shows]
  );

  // Hook de filtrage (logique locale)
  const {
    activeTab,
    handleTabChange,
    upcomingShowsList,
    pastShowsList,
    todayShows,
    laterShows,
    hasShows,
    hasDisplayedShows,
  } = useShowsFiltering({ shows: validShows });

  // Handler navigation vers spectacle
  const handleShowClick = useCallback(
    (showSlug: string) => {
      router.push(`/accueil/${showSlug}`);
    },
    [router]
  );

  // États dérivés pour le rendu conditionnel (mémorisés)
  const flags = useMemo(
    () => ({
      showTabs: !isLoadingShows && !showsError && hasShows,
      showEmptyGlobal: !isLoadingShows && !showsError && !hasShows,
      showRefreshButton: !isLoadingShows && !showsError && hasDisplayedShows,
      showLoadingOverlay: isLoadingShows && hasShows,
    }),
    [isLoadingShows, showsError, hasShows, hasDisplayedShows]
  );

  const { showTabs, showEmptyGlobal, showRefreshButton, showLoadingOverlay } = flags;

  return (
    <div className="pb-6">
      {/* En-tête contextuel */}
      <HeaderSection isAdmin={isAdmin} role={role} companyName={companyName} />

      {/* Onglets À venir / Passés */}
      {showTabs && (
        <TabFilters
          activeTab={activeTab}
          onTabChange={handleTabChange}
          upcomingCount={upcomingShowsList.length}
          pastCount={pastShowsList.length}
        />
      )}

      {/* Contenu principal */}
      <main
        className="px-4 pt-4 space-y-6"
        aria-busy={isLoadingShows}
        aria-live="polite"
      >
        {/* État : Chargement initial */}
        {isLoadingShows && !hasShows && (
          <div className="space-y-3" role="status" aria-label="Chargement des spectacles">
            <ShowCardSkeleton />
            <ShowCardSkeleton />
            <ShowCardSkeleton />
          </div>
        )}

        {/* État : Erreur */}
        {!isLoadingShows && showsError && (
          <ErrorState message={showsError} onRetry={loadShows} />
        )}

        {/* État : Liste vide globale */}
        {showEmptyGlobal && (
          <EmptyState
            icon={Theater}
            title="Aucun spectacle"
            message={
              isAdmin
                ? 'Aucun spectacle avec des représentations à venir.'
                : "Vous n'êtes assigné à aucune représentation à venir."
            }
          />
        )}

        {/* Contenu onglet "À venir" */}
        {!isLoadingShows && !showsError && activeTab === 'upcoming' && (
          <>
            {upcomingShowsList.length === 0 && hasShows && (
              <EmptyTabMessage displayMode="upcoming" />
            )}
            {upcomingShowsList.length > 0 && (
              <ShowsList
                shows={upcomingShowsList}
                displayMode="upcoming"
                onShowClick={handleShowClick}
                todayShows={todayShows}
                laterShows={laterShows}
              />
            )}
          </>
        )}

        {/* Contenu onglet "Passés" */}
        {!isLoadingShows && !showsError && activeTab === 'past' && (
          <>
            {pastShowsList.length === 0 && hasShows && (
              <EmptyTabMessage displayMode="past" />
            )}
            {pastShowsList.length > 0 && (
              <ShowsList
                shows={pastShowsList}
                displayMode="past"
                onShowClick={handleShowClick}
              />
            )}
          </>
        )}

        {/* Bouton Actualiser */}
        {showRefreshButton && (
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadShows}
              className="w-full"
              aria-label="Actualiser la liste des spectacles"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              Actualiser
            </Button>
          </div>
        )}
      </main>

      {/* Overlay de chargement (refresh) */}
      <LoadingOverlay visible={showLoadingOverlay} />
    </div>
  );
}
