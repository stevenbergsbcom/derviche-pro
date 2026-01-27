'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { searchMatch } from '@/lib/utils';

// Hooks Supabase
import { useRepresentations } from '@/hooks/useRepresentations';
import { useVenues } from '@/hooks/useVenues';
import { useShows } from '@/hooks/useShows';
import { useInternalUsers } from '@/hooks/useInternalUsers';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { getRepresentationById } from '@/lib/services/representations';

// Types et constantes
import { UNLIMITED_CAPACITY, UUID_REGEX } from '../constants';
import {
  slotToMockRepresentation,
  venueToMockVenue,
  internalUserToMockUser,
  getMonthFromDate,
  formatDate,
} from '../helpers';
import type {
  MockRepresentation,
  MockVenue,
  MockUser,
  EnrichedShow,
  RepresentationsPageState,
  RepresentationsPageActions,
} from '../types';
import type {
  RepresentationFormData,
  GenerateSeriesData,
  GeneratedRepresentation,
} from '@/components/admin/representations';

/**
 * Hook principal pour la page des représentations
 * Gère toute la logique : état, données dérivées, handlers
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
  // ÉTAT DES MODALES
  // ============================================

  const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
  const [editingRepresentation, setEditingRepresentation] = useState<MockRepresentation | null>(null);
  const [editingReservationsCount, setEditingReservationsCount] = useState<number>(0);
  const [representationToDelete, setRepresentationToDelete] = useState<MockRepresentation | null>(null);
  const [deleteReservationsCount, setDeleteReservationsCount] = useState<number>(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isNewVenueDialogOpen, setIsNewVenueDialogOpen] = useState<boolean>(false);
  const [newVenueSource, setNewVenueSource] = useState<'simple' | 'series'>('simple');
  const [isGenerateSeriesOpen, setIsGenerateSeriesOpen] = useState(false);
  const [newlyCreatedVenueId, setNewlyCreatedVenueId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSubmitting = isEditing || isDeleting;

  // Refs pour éviter les race conditions
  const pendingDeleteRef = useRef<string | null>(null);
  const pendingEditRef = useRef<string | null>(null);

  // ============================================
  // FILTRES
  // ============================================

  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [dateSearch, setDateSearch] = useState<string>('');

  const hasActiveFilters = monthFilter !== 'all' || venueFilter !== 'all' || dateSearch.trim() !== '';

  const resetFilters = useCallback(() => {
    setMonthFilter('all');
    setVenueFilter('all');
    setDateSearch('');
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    representations.forEach((rep) => {
      months.add(getMonthFromDate(rep.date));
    });
    return Array.from(months).sort();
  }, [representations]);

  const usedVenues = useMemo(() => {
    const venueIds = new Set<string>();
    representations.forEach((rep) => {
      venueIds.add(rep.venueId);
    });
    return Array.from(venueIds)
      .map((id) => venues.find((v) => v.id === id))
      .filter(Boolean) as MockVenue[];
  }, [representations, venues]);

  const filteredRepresentations = useMemo(() => {
    let filtered = [...representations];

    if (monthFilter !== 'all') {
      filtered = filtered.filter((rep) => getMonthFromDate(rep.date) === monthFilter);
    }

    if (venueFilter !== 'all') {
      filtered = filtered.filter((rep) => rep.venueId === venueFilter);
    }

    if (dateSearch.trim()) {
      filtered = filtered.filter((rep) => {
        const formattedDate = formatDate(rep.date);
        return searchMatch(formattedDate, dateSearch);
      });
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [representations, monthFilter, venueFilter, dateSearch]);

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
  // HANDLERS - CLEAR STATE
  // ============================================

  const clearEditingState = useCallback(() => {
    setEditingReservationsCount(0);
  }, []);

  const clearDeleteState = useCallback(() => {
    setRepresentationToDelete(null);
    setDeleteReservationsCount(0);
    setDeleteError(null);
  }, []);

  const clearNewlyCreatedVenueId = useCallback(() => {
    setNewlyCreatedVenueId(null);
  }, []);

  // ============================================
  // HANDLERS - CRUD
  // ============================================

  const handleCreate = useCallback(() => {
    setEditingRepresentation(null);
    setEditingReservationsCount(0);
    setIsFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback(
    async (representation: MockRepresentation) => {
      const representationId = representation.id;
      pendingEditRef.current = representationId;
      setIsEditing(true);

      try {
        const result = await checkReservations(representationId);

        if (pendingEditRef.current !== representationId) {
          return;
        }

        if (result.error) {
          console.error('Erreur vérification réservations (handleEdit):', result.error);
          toast.error('Échec de la vérification', {
            description: 'Impossible de vérifier les réservations. Veuillez réessayer.',
          });
          return;
        }

        setEditingReservationsCount(result.count);
        setEditingRepresentation(representation);
        setIsFormDialogOpen(true);
      } finally {
        const currentRef = pendingEditRef.current;
        if (currentRef === representationId) {
          setIsEditing(false);
          pendingEditRef.current = null;
        }
      }
    },
    [checkReservations]
  );

  const handleDeleteClick = useCallback(
    async (representation: MockRepresentation) => {
      const representationId = representation.id;
      pendingDeleteRef.current = representationId;
      setIsDeleting(true);

      try {
        const result = await checkReservations(representationId);

        if (pendingDeleteRef.current !== representationId) {
          return;
        }

        if (result.error) {
          console.error('Erreur vérification réservations:', result.error);
          toast.error('Échec de la vérification', {
            description: 'Impossible de vérifier les réservations. Veuillez réessayer.',
          });
          return;
        }

        setDeleteReservationsCount(result.count);
        setRepresentationToDelete(representation);
        setDeleteError(null);
      } finally {
        const currentRef = pendingDeleteRef.current;
        if (currentRef === representationId) {
          setIsDeleting(false);
          pendingDeleteRef.current = null;
        }
      }
    },
    [checkReservations]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!representationToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const result = await removeSlot(representationToDelete.id);

      if (result.success) {
        setRepresentationToDelete(null);
        setDeleteReservationsCount(0);
        setDeleteError(null);
      } else {
        const errorMessage = result.error || 'Une erreur est survenue lors de la suppression';
        setDeleteError(errorMessage);
        console.error('Erreur suppression:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
      setDeleteError(errorMessage);
      console.error('Erreur suppression:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [representationToDelete, removeSlot]);

  const handleFormSubmit = useCallback(
    async (formData: RepresentationFormData, isEditingForm: boolean) => {
      const capacity = formData.capacity === null ? UNLIMITED_CAPACITY : formData.capacity;
      const hostedById =
        formData.hostedById && UUID_REGEX.test(formData.hostedById) ? formData.hostedById : null;

      if (isEditingForm && editingRepresentation) {
        let originalSlot = slotsData.find((s) => s.id === editingRepresentation.id);

        if (!originalSlot) {
          const slotResult = await getRepresentationById(editingRepresentation.id);
          if (slotResult.error || !slotResult.data) {
            throw new Error(
              slotResult.error ||
                'Impossible de récupérer les données de la représentation. Veuillez réessayer.'
            );
          }
          originalSlot = slotResult.data;
        }

        const reservationsResult = await checkReservations(editingRepresentation.id);
        if (reservationsResult.error) {
          throw new Error(
            reservationsResult.error ||
              'Impossible de vérifier le nombre de réservations. Veuillez réessayer.'
          );
        }
        const booked = reservationsResult.count;

        if (booked > 0) {
          const dateChanged = formData.date !== editingRepresentation.date;
          const timeChanged = formData.time !== editingRepresentation.time;
          if (dateChanged || timeChanged) {
            throw new Error(
              "Impossible de modifier la date ou l'heure : des réservations ont été effectuées depuis l'ouverture du formulaire. Veuillez fermer et réouvrir le formulaire."
            );
          }
        }

        if (capacity < UNLIMITED_CAPACITY && capacity < booked) {
          throw new Error(
            `Impossible de réduire la capacité en dessous de ${booked} (places déjà réservées)`
          );
        }

        const newRemaining = capacity >= UNLIMITED_CAPACITY ? UNLIMITED_CAPACITY - booked : capacity - booked;

        const result = await updateSlot(editingRepresentation.id, {
          date: formData.date,
          time: formData.time + ':00',
          venue_id: formData.venueId,
          capacity,
          remaining_capacity: newRemaining,
          hosted_by: formData.hostedBy,
          hosted_by_id: hostedById,
        });

        if (!result.success) {
          throw new Error(result.error || 'Erreur lors de la mise à jour');
        }
      } else {
        const result = await createSlot({
          show_id: showId,
          date: formData.date,
          time: formData.time + ':00',
          venue_id: formData.venueId,
          capacity,
          remaining_capacity: capacity,
          hosted_by: formData.hostedBy,
          hosted_by_id: hostedById,
        });

        if (!result.success) {
          throw new Error(result.error || 'Erreur lors de la création');
        }
      }

      setEditingRepresentation(null);
    },
    [editingRepresentation, slotsData, checkReservations, updateSlot, createSlot, showId]
  );

  const handleGenerateSeriesSubmit = useCallback(
    async (data: GenerateSeriesData, repsToCreate: GeneratedRepresentation[]) => {
      if (repsToCreate.length === 0) return;

      const capacity = data.isUnlimited ? UNLIMITED_CAPACITY : data.capacity || 1;
      const hostedById = data.hostedById && UUID_REGEX.test(data.hostedById) ? data.hostedById : null;

      const slotsToInsert = repsToCreate.map((rep) => ({
        show_id: showId,
        date: rep.date,
        time: rep.time + ':00',
        venue_id: rep.venueId,
        capacity,
        remaining_capacity: capacity,
        hosted_by: data.hostedBy,
        hosted_by_id: hostedById,
      }));

      const result = await createSlotBatch(slotsToInsert);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la génération de la série');
      }
    },
    [showId, createSlotBatch]
  );

  // ============================================
  // HANDLERS - VENUES
  // ============================================

  const handleOpenNewVenueDialog = useCallback((source: 'simple' | 'series') => {
    setNewVenueSource(source);
    setIsNewVenueDialogOpen(true);
  }, []);

  const handleCreateVenue = useCallback(
    async (data: { name: string; city: string }): Promise<string> => {
      const result = await createVenue({
        name: data.name,
        city: data.city,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erreur lors de la création du lieu');
      }

      setNewlyCreatedVenueId(result.data.id);
      return result.data.id;
    },
    [createVenue]
  );

  const handleVenueCreated = useCallback((venueId: string) => {
    if (venueId) {
      setNewlyCreatedVenueId(venueId);
    }
  }, []);

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

    // Filtres
    monthFilter,
    venueFilter,
    dateSearch,
    availableMonths,
    usedVenues,
    filteredRepresentations,
    hasActiveFilters,

    // États UI
    isLoading,
    loadingError,
    hasLoaded,
    isExterne,

    // Modales
    isFormDialogOpen,
    editingRepresentation,
    editingReservationsCount,
    representationToDelete,
    deleteReservationsCount,
    deleteError,
    isNewVenueDialogOpen,
    newVenueSource,
    isGenerateSeriesOpen,
    newlyCreatedVenueId,
    isSubmitting,

    // Actions - Filtres
    setMonthFilter,
    setVenueFilter,
    setDateSearch,
    resetFilters,

    // Actions - Modales
    setIsFormDialogOpen,
    setIsGenerateSeriesOpen,
    setIsNewVenueDialogOpen,
    clearEditingState,
    clearDeleteState,
    clearNewlyCreatedVenueId,

    // Actions - CRUD
    handleCreate,
    handleEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleFormSubmit,
    handleGenerateSeriesSubmit,

    // Actions - Venues
    handleOpenNewVenueDialog,
    handleCreateVenue,
    handleVenueCreated,

    // Actions - Refresh
    refreshAllData,
  };
}
