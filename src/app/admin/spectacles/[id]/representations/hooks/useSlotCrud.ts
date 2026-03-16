'use client';

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { getRepresentationById } from '@/lib/services/representations';
import type { SlotWithRelations } from '@/lib/services/representations';
import type { SlotInsert, SlotUpdate, VenueRow, VenueInsert } from '@/types/database';

import { UNLIMITED_CAPACITY, UUID_REGEX } from '../constants';
import type { MockRepresentation } from '../types';
import type {
  RepresentationFormData,
  GenerateSeriesData,
  GeneratedRepresentation,
} from '@/components/admin/representations';

// ============================================
// TYPES
// ============================================

interface UseSlotCrudParams {
  showId: string;
  slotsData: SlotWithRelations[];
  createSlot: (slot: SlotInsert) => Promise<{ success: boolean; data?: SlotWithRelations; error?: string }>;
  createSlotBatch: (slots: SlotInsert[]) => Promise<{ success: boolean; count: number; error?: string }>;
  updateSlot: (id: string, slot: SlotUpdate) => Promise<{ success: boolean; data?: SlotWithRelations; error?: string }>;
  removeSlot: (id: string) => Promise<{ success: boolean; error?: string }>;
  checkReservations: (id: string) => Promise<{ count: number; error: string | null }>;
  createVenue: (venue: VenueInsert) => Promise<{ success: boolean; data?: VenueRow; error?: string }>;
}

export interface UseSlotCrudReturn {
  // État des modales
  isFormDialogOpen: boolean;
  editingRepresentation: MockRepresentation | null;
  editingReservationsCount: number;
  representationToDelete: MockRepresentation | null;
  deleteReservationsCount: number;
  deleteError: string | null;
  isNewVenueDialogOpen: boolean;
  newVenueSource: 'simple' | 'series';
  isGenerateSeriesOpen: boolean;
  newlyCreatedVenueId: string | null;
  isSubmitting: boolean;

  // Setters de modales
  setIsFormDialogOpen: (open: boolean) => void;
  setIsGenerateSeriesOpen: (open: boolean) => void;
  setIsNewVenueDialogOpen: (open: boolean) => void;
  clearEditingState: () => void;
  clearDeleteState: () => void;
  clearNewlyCreatedVenueId: () => void;

  // Handlers CRUD
  handleCreate: () => void;
  handleEdit: (rep: MockRepresentation) => Promise<void>;
  handleDeleteClick: (rep: MockRepresentation) => Promise<void>;
  handleConfirmDelete: () => Promise<void>;
  handleFormSubmit: (formData: RepresentationFormData, isEditing: boolean) => Promise<void>;
  handleGenerateSeriesSubmit: (data: GenerateSeriesData, repsToCreate: GeneratedRepresentation[]) => Promise<void>;

  // Handlers Venues
  handleOpenNewVenueDialog: (source: 'simple' | 'series') => void;
  handleCreateVenue: (data: { name: string; city: string }) => Promise<string>;
  handleVenueCreated: (venueId: string) => void;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook pour les opérations CRUD sur les représentations et la gestion des modales
 */
export function useSlotCrud({
  showId,
  slotsData,
  createSlot,
  createSlotBatch,
  updateSlot,
  removeSlot,
  checkReservations,
  createVenue,
}: UseSlotCrudParams): UseSlotCrudReturn {
  // ============================================
  // ÉTAT DES MODALES
  // ============================================

  const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
  const [editingRepresentation, setEditingRepresentation] = useState<MockRepresentation | null>(
    null
  );
  const [editingReservationsCount, setEditingReservationsCount] = useState<number>(0);
  const [representationToDelete, setRepresentationToDelete] =
    useState<MockRepresentation | null>(null);
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
          logger.error('[representations] Erreur vérification réservations (handleEdit)', {
            error: result.error,
          });
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
          logger.error(
            '[representations] Erreur vérification réservations (handleDeleteClick)',
            { error: result.error }
          );
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
        logger.error('[representations] Erreur suppression', { error: result.error });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
      setDeleteError(errorMessage);
      logger.error('[representations] Exception suppression', { error });
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

        const newRemaining =
          capacity >= UNLIMITED_CAPACITY ? UNLIMITED_CAPACITY : capacity - booked;

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
      const hostedById =
        data.hostedById && UUID_REGEX.test(data.hostedById) ? data.hostedById : null;

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

  return {
    // État des modales
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

    // Setters de modales
    setIsFormDialogOpen,
    setIsGenerateSeriesOpen,
    setIsNewVenueDialogOpen,
    clearEditingState,
    clearDeleteState,
    clearNewlyCreatedVenueId,

    // Handlers CRUD
    handleCreate,
    handleEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleFormSubmit,
    handleGenerateSeriesSubmit,

    // Handlers Venues
    handleOpenNewVenueDialog,
    handleCreateVenue,
    handleVenueCreated,
  };
}
