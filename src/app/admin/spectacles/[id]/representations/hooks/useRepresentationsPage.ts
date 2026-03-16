'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Hooks Supabase
import { useRepresentations } from '@/hooks/useRepresentations';
import { useVenues } from '@/hooks/useVenues';
import { useShows } from '@/hooks/useShows';
import { useInternalUsers } from '@/hooks/useInternalUsers';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

// Hooks locaux
import { useSlotFilters } from './useSlotFilters';
import { useSlotCrud } from './useSlotCrud';

// Helpers et types
import {
  slotToMockRepresentation,
  venueToMockVenue,
  internalUserToMockUser,
} from '../helpers';
import type {
  MockRepresentation,
  MockVenue,
  MockUser,
  EnrichedShow,
  RepresentationsPageState,
  RepresentationsPageActions,
} from '../types';

/**
 * Hook principal pour la page des représentations
 * Orchestre les sous-hooks et compose l'état global
 */
export function useRepresentationsPage(): RepresentationsPageState & RepresentationsPageActions {
  const params = useParams();
  const router = useRouter();

  // Sécuriser params.id : peut être string, string[] ou undefined en Next.js App Router
  const showId = typeof params?.id === 'string' ? params.id : '';

  // État pour éviter les erreurs d'hydratation SSR/Client
  const [isMounted, setIsMounted] = useState(false);

  // Rediriger si showId est vide (paramètre manquant)
  useEffect(() => {
    if (isMounted && !showId) {
      router.push('/admin/spectacles');
    }
  }, [isMounted, showId, router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ============================================
  // HOOKS SUPABASE
  // ============================================

  const {
    representations: slotsData,
    isLoading: slotsLoading,
    error: slotsError,
    create: createSlot,
    createBatch: createSlotBatch,
    update: updateSlot,
    remove: removeSlot,
    checkReservations,
    refresh: refreshSlots,
  } = useRepresentations(showId);

  const {
    venues: venuesData,
    isLoading: venuesLoading,
    error: venuesError,
    create: createVenue,
    refresh: refreshVenues,
  } = useVenues();

  const {
    shows: showsData,
    isLoading: showsLoading,
    hasLoaded: showsHasLoaded,
    error: showsError,
    refresh: refreshShows,
  } = useShows();

  const {
    users: internalUsersData,
    isLoading: usersLoading,
    error: usersError,
    refresh: refreshUsers,
  } = useInternalUsers();

  const { isExterne } = useAdminPermissions();

  // ============================================
  // DONNÉES DÉRIVÉES (MÉMORISÉES)
  // ============================================

  const show: EnrichedShow | null = useMemo(() => {
    const foundShow = showsData.find((s) => s.id === showId);
    if (!foundShow) return null;

    return {
      ...foundShow,
      company: {
        name: foundShow.company_name,
      },
    };
  }, [showsData, showId]);

  const representations: MockRepresentation[] = useMemo(() => {
    if (!show) return [];
    return slotsData.map((slot) =>
      slotToMockRepresentation(slot, show.title, show.company?.name || 'Compagnie inconnue')
    );
  }, [slotsData, show]);

  const venues: MockVenue[] = useMemo(() => {
    return venuesData.map(venueToMockVenue);
  }, [venuesData]);

  const internalUsers: MockUser[] = useMemo(() => {
    return internalUsersData.map(internalUserToMockUser);
  }, [internalUsersData]);

  // ============================================
  // SOUS-HOOKS
  // ============================================

  const filters = useSlotFilters({ representations, venues });

  const crud = useSlotCrud({
    showId,
    slotsData,
    createSlot,
    createSlotBatch,
    updateSlot,
    removeSlot,
    checkReservations,
    createVenue,
  });

  // ============================================
  // ÉTATS DE CHARGEMENT
  // ============================================

  const isLoading = !isMounted || slotsLoading || venuesLoading || showsLoading || usersLoading;
  const loadingError = slotsError || venuesError || showsError || usersError;
  const hasLoaded = showsHasLoaded;

  // ============================================
  // HANDLERS - REFRESH
  // ============================================

  const refreshAllData = useCallback(async () => {
    await Promise.all([refreshSlots(), refreshVenues(), refreshShows(), refreshUsers()]);
  }, [refreshSlots, refreshVenues, refreshShows, refreshUsers]);

  // ============================================
  // REDIRECTION SI SPECTACLE INEXISTANT
  // ============================================

  useEffect(() => {
    if (!show && hasLoaded && !isLoading) {
      router.push('/admin/spectacles');
    }
  }, [show, hasLoaded, isLoading, router]);

  // ============================================
  // RETOUR
  // ============================================

  return {
    // Données
    show,
    representations,
    venues,
    internalUsers,

    // Filtres (depuis useSlotFilters)
    ...filters,

    // États UI
    isLoading,
    loadingError,
    hasLoaded,
    isExterne,

    // Modales et CRUD (depuis useSlotCrud)
    ...crud,

    // Actions - Refresh
    refreshAllData,
  };
}
