/**
 * Hook de filtrage des spectacles pour la page Accueil
 * Derviche Diffusion - PWA Check-in
 * 
 * Encapsule la logique de filtrage et de séparation des spectacles :
 * - À venir vs Passés
 * - Aujourd'hui vs Prochainement (pour les spectacles à venir)
 */

import { useMemo, useCallback, useState } from 'react';
import { isSlotToday } from '@/lib/services/checkin';
import type { ShowListItem, TabFilter } from '../types';
import { isTabFilter } from '../types';

interface UseShowsFilteringProps {
  shows: ShowListItem[];
}

interface UseShowsFilteringReturn {
  /** Onglet actif */
  activeTab: TabFilter;
  /** Handler changement d'onglet avec validation */
  handleTabChange: (value: string) => void;
  /** Spectacles avec représentations à venir */
  upcomingShowsList: ShowListItem[];
  /** Spectacles sans représentations à venir (uniquement passées) */
  pastShowsList: ShowListItem[];
  /** Spectacles d'aujourd'hui (pour onglet "upcoming") */
  todayShows: ShowListItem[];
  /** Spectacles à venir hors aujourd'hui (pour onglet "upcoming") */
  laterShows: ShowListItem[];
  /** Y a-t-il des spectacles dans la liste globale ? */
  hasShows: boolean;
  /** Y a-t-il des spectacles dans l'onglet actif ? */
  hasDisplayedShows: boolean;
}

/**
 * Hook de filtrage des spectacles
 * Sépare les spectacles en catégories et gère l'onglet actif
 */
export function useShowsFiltering({ shows }: UseShowsFilteringProps): UseShowsFilteringReturn {
  const [activeTab, setActiveTab] = useState<TabFilter>('upcoming');

  // Handler changement d'onglet avec validation type guard
  const handleTabChange = useCallback((value: string) => {
    if (isTabFilter(value)) {
      setActiveTab(value);
    }
  }, []);

  // Spectacles avec représentations à venir
  const upcomingShowsList = useMemo(
    () => shows.filter((show) => show.upcomingSlotsCount > 0),
    [shows]
  );

  // Spectacles sans représentations à venir (uniquement passées)
  const pastShowsList = useMemo(
    () => shows.filter((show) => show.upcomingSlotsCount === 0 && show.pastSlotsCount > 0),
    [shows]
  );

  // Spectacles affichés selon l'onglet actif (utilisé pour hasDisplayedShows)
  const displayedShowsLength = useMemo(
    () => (activeTab === 'upcoming' ? upcomingShowsList.length : pastShowsList.length),
    [activeTab, upcomingShowsList.length, pastShowsList.length]
  );

  // Spectacles d'aujourd'hui (pour l'onglet "upcoming")
  const todayShows = useMemo(
    () => upcomingShowsList.filter((show) => show.nextSlot && isSlotToday(show.nextSlot.date)),
    [upcomingShowsList]
  );

  // Spectacles à venir hors aujourd'hui
  const laterShows = useMemo(
    () => upcomingShowsList.filter((show) => !show.nextSlot || !isSlotToday(show.nextSlot.date)),
    [upcomingShowsList]
  );

  // Helpers booléens (mémorisés)
  const hasShows = useMemo(() => shows.length > 0, [shows.length]);
  const hasDisplayedShows = useMemo(
    () => displayedShowsLength > 0,
    [displayedShowsLength]
  );

  return {
    activeTab,
    handleTabChange,
    upcomingShowsList,
    pastShowsList,
    todayShows,
    laterShows,
    hasShows,
    hasDisplayedShows,
  };
}
