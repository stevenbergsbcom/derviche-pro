/**
 * Hook CRUD et gestion des modales pour les spectacles
 * Extrait de useSpectaclesPage (S191)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Services
import {
  uploadShowImage,
  deleteShowImage,
  replaceShowImage,
} from '@/lib/services/storage';
import type { ShowWithRelations } from '@/lib/services/shows';
import type { ShowCategoryRow, TargetAudienceRow } from '@/types/database';
import type { SpectacleFormData } from '@/components/admin/spectacles/spectacle-form-dialog';

// Types locaux
import type { ShowForDisplay } from '../types';
import { REOPEN_VIEW_DELAY } from '../constants';

// ============================================================================
// Types
// ============================================================================

interface UseSpectacleCrudParams {
  rawShows: ShowWithRelations[];
  shows: ShowForDisplay[];
  rawCategories: ShowCategoryRow[];
  rawTargetAudiences: TargetAudienceRow[];
  // CRUD spectacles
  createShow: (input: {
    show: Record<string, unknown>;
    category_ids: string[];
    target_audience_ids: string[];
  }) => Promise<{ success: boolean; data?: ShowWithRelations; error?: string }>;
  updateShow: (
    id: string,
    input: {
      show: Record<string, unknown>;
      category_ids?: string[];
      target_audience_ids?: string[];
    }
  ) => Promise<{ success: boolean; data?: ShowWithRelations; error?: string }>;
  removeShow: (id: string) => Promise<{ success: boolean; error?: string }>;
  checkShowUsage: (
    id: string
  ) => Promise<{ used: boolean; count: number; error: string | null }>;
  generateSlug: (title: string) => string;
  // Categories
  createCategory: (
    name: string
  ) => Promise<{ success: boolean; data?: ShowCategoryRow; error?: string }>;
  removeCategory: (id: string) => Promise<{ success: boolean; error?: string }>;
  checkCategoryUsage: (
    id: string
  ) => Promise<{ used: boolean; count: number; error: string | null }>;
  // Target audiences
  createTargetAudience: (
    name: string
  ) => Promise<{ success: boolean; data?: TargetAudienceRow; error?: string }>;
  removeTargetAudience: (id: string) => Promise<{ success: boolean; error?: string }>;
  checkTargetAudienceUsage: (
    id: string
  ) => Promise<{ used: boolean; count: number; error: string | null }>;
  // Companies
  createCompany: (data: {
    name: string;
    contact_email: string | null;
  }) => Promise<{ success: boolean; data?: { id: string }; error?: string }>;
}

// ============================================================================
// Hook
// ============================================================================

export function useSpectacleCrud({
  rawShows,
  shows,
  rawCategories,
  rawTargetAudiences,
  createShow,
  updateShow,
  removeShow,
  checkShowUsage,
  generateSlug,
  createCategory,
  removeCategory,
  checkCategoryUsage,
  createTargetAudience,
  removeTargetAudience,
  checkTargetAudienceUsage,
  createCompany,
}: UseSpectacleCrudParams) {
  // ============================================================================
  // États modales
  // ============================================================================

  const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
  const [editingShow, setEditingShow] = useState<ShowForDisplay | null>(null);
  const [editingShowRaw, setEditingShowRaw] = useState<ShowWithRelations | null>(null);
  const [viewingShow, setViewingShow] = useState<ShowForDisplay | null>(null);
  const [viewingShowRaw, setViewingShowRaw] = useState<ShowWithRelations | null>(null);
  const [showToDelete, setShowToDelete] = useState<ShowForDisplay | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState<boolean>(false);
  const [isAudiencesDialogOpen, setIsAudiencesDialogOpen] = useState<boolean>(false);
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState<boolean>(false);
  const [newlyCreatedCompanyId, setNewlyCreatedCompanyId] = useState<string | null>(null);

  // États d'opération
  const [operationError, setOperationError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showIdToReopen, setShowIdToReopen] = useState<string | null>(null);

  // Ref pour éviter les race conditions
  const pendingDeleteCheckRef = useRef<string | null>(null);

  // ============================================================================
  // Effet : réouverture de la vue après édition
  // ============================================================================

  useEffect(() => {
    if (showIdToReopen && !isFormDialogOpen) {
      const timeout = setTimeout(() => {
        const show = shows.find((s) => s.id === showIdToReopen);
        const rawShow = rawShows.find((s) => s.id === showIdToReopen);
        if (show && rawShow) {
          setViewingShow(show);
          setViewingShowRaw(rawShow);
          setShowIdToReopen(null);
        }
      }, REOPEN_VIEW_DELAY);

      return () => clearTimeout(timeout);
    }
  }, [showIdToReopen, isFormDialogOpen, shows, rawShows]);

  // ============================================================================
  // Handlers CRUD
  // ============================================================================

  const handleCreate = useCallback(() => {
    setOperationError(null);
    setEditingShow(null);
    setEditingShowRaw(null);
    setIsFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback(
    (show: ShowForDisplay) => {
      setOperationError(null);
      const rawShow = rawShows.find((s) => s.id === show.id);
      if (!rawShow) {
        setOperationError("Ce spectacle n'est plus disponible. Veuillez rafraîchir la page.");
        return;
      }
      setEditingShow(show);
      setEditingShowRaw(rawShow);
      setIsFormDialogOpen(true);
    },
    [rawShows]
  );

  const handleView = useCallback(
    (show: ShowForDisplay) => {
      const rawShow = rawShows.find((s) => s.id === show.id);
      if (!rawShow) {
        setOperationError("Ce spectacle n'est plus disponible. Veuillez rafraîchir la page.");
        return;
      }
      setViewingShow(show);
      setViewingShowRaw(rawShow);
    },
    [rawShows]
  );

  const handleDeleteClick = useCallback(
    async (show: ShowForDisplay) => {
      setOperationError(null);
      pendingDeleteCheckRef.current = show.id;
      setDeleteWarning(null);
      setShowToDelete(show);

      const usage = await checkShowUsage(show.id);

      if (pendingDeleteCheckRef.current !== show.id) return;

      if (usage.error) {
        setDeleteWarning(
          'Impossible de vérifier les représentations associées. La suppression sera quand même possible.'
        );
        return;
      }

      if (usage.used) {
        setDeleteWarning(
          `Ce spectacle a ${usage.count} représentation(s) associée(s). La suppression masquera le spectacle mais conservera les données.`
        );
      }
    },
    [checkShowUsage]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!showToDelete) return;

    setIsDeleting(true);
    try {
      const rawShow = rawShows.find((s) => s.id === showToDelete.id);
      if (rawShow?.image_url) {
        await deleteShowImage(rawShow.image_url);
      }

      const result = await removeShow(showToDelete.id);
      if (result.error) {
        setOperationError(result.error);
        return;
      }
      setShowToDelete(null);
      setDeleteWarning(null);
      pendingDeleteCheckRef.current = null;
    } finally {
      setIsDeleting(false);
    }
  }, [showToDelete, rawShows, removeShow]);

  const handleViewToEdit = useCallback(() => {
    if (viewingShow) {
      const showToEdit = viewingShow;
      setShowIdToReopen(showToEdit.id);
      setViewingShow(null);
      setViewingShowRaw(null);
      handleEdit(showToEdit);
    }
  }, [viewingShow, handleEdit]);

  const handleViewToDelete = useCallback(() => {
    if (viewingShow) {
      const showToRemove = viewingShow;
      setViewingShow(null);
      setViewingShowRaw(null);
      void handleDeleteClick(showToRemove);
    }
  }, [viewingShow, handleDeleteClick]);

  const handleCloseView = useCallback(() => {
    setViewingShow(null);
    setViewingShowRaw(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (formData: SpectacleFormData, isEditing: boolean) => {
      let finalImageUrl: string | null = formData.imageUrl;

      if (isEditing && editingShow) {
        if (formData.imageFile) {
          const oldImageUrl = editingShowRaw?.image_url || null;
          const uploadResult = await replaceShowImage(formData.imageFile, editingShow.id, oldImageUrl);
          if (!uploadResult.success) throw new Error(uploadResult.error || "Erreur lors de l'upload de l'image");
          finalImageUrl = uploadResult.url || null;
        } else if (formData.imageRemoved && editingShowRaw?.image_url) {
          await deleteShowImage(editingShowRaw.image_url);
          finalImageUrl = null;
        }

        const showData = {
          slug: formData.slug || generateSlug(formData.title),
          title: formData.title.trim(),
          company_id: formData.companyId,
          short_description: formData.shortDescription?.trim() || null,
          long_description: formData.description?.trim() || null,
          duration_minutes: formData.duration,
          image_url: finalImageUrl,
          status: formData.status,
          price_type: formData.priceType,
          period: formData.period?.trim() || null,
          derviche_manager_id: formData.dervisheManagerId || null,
          invitation_policy: formData.invitationPolicy?.trim() || null,
          max_reservations_per_booking: formData.maxParticipantsPerBooking ?? 5,
          closure_dates: formData.closureDates?.trim() || null,
          folder_url: formData.folderUrl?.trim() || null,
          teaser_url: formData.teaserUrl?.trim() || null,
          captation_available: formData.captationAvailable,
          captation_url: formData.captationAvailable ? formData.captationUrl?.trim() || null : null,
          photo_folder_url: formData.photoFolderUrl?.trim() || null,
        };

        const result = await updateShow(editingShow.id, {
          show: showData,
          category_ids: formData.categoryIds,
          target_audience_ids: formData.targetAudienceIds,
        });
        if (result.error) throw new Error(result.error);
      } else {
        const showData = {
          slug: formData.slug || generateSlug(formData.title),
          title: formData.title.trim(),
          company_id: formData.companyId,
          short_description: formData.shortDescription?.trim() || null,
          long_description: formData.description?.trim() || null,
          duration_minutes: formData.duration,
          image_url: null,
          status: formData.status,
          price_type: formData.priceType,
          period: formData.period?.trim() || null,
          derviche_manager_id: formData.dervisheManagerId || null,
          invitation_policy: formData.invitationPolicy?.trim() || null,
          max_reservations_per_booking: formData.maxParticipantsPerBooking ?? 5,
          closure_dates: formData.closureDates?.trim() || null,
          folder_url: formData.folderUrl?.trim() || null,
          teaser_url: formData.teaserUrl?.trim() || null,
          captation_available: formData.captationAvailable,
          captation_url: formData.captationAvailable ? formData.captationUrl?.trim() || null : null,
          photo_folder_url: formData.photoFolderUrl?.trim() || null,
        };

        const createResult = await createShow({
          show: showData,
          category_ids: formData.categoryIds,
          target_audience_ids: formData.targetAudienceIds,
        });

        if (createResult.error || !createResult.data) {
          throw new Error(createResult.error || 'Erreur lors de la création du spectacle');
        }

        if (formData.imageFile) {
          const newShowId = createResult.data.id;
          const uploadResult = await uploadShowImage(formData.imageFile, newShowId);

          if (!uploadResult.success) {
            setIsFormDialogOpen(false);
            setEditingShow(null);
            setEditingShowRaw(null);
            setOperationError(`Le spectacle a été créé, mais l'image n'a pas pu être uploadée: ${uploadResult.error || 'Erreur inconnue'}`);
            return;
          }

          if (!uploadResult.url) {
            setIsFormDialogOpen(false);
            setEditingShow(null);
            setEditingShowRaw(null);
            setOperationError("Le spectacle a été créé, mais l'URL de l'image n'a pas été générée. Vous pouvez réessayer en modifiant le spectacle.");
            return;
          }

          const updateResult = await updateShow(newShowId, {
            show: { image_url: uploadResult.url },
            category_ids: formData.categoryIds,
            target_audience_ids: formData.targetAudienceIds,
          });

          if (updateResult.error) {
            setIsFormDialogOpen(false);
            setEditingShow(null);
            setEditingShowRaw(null);
            setOperationError("Le spectacle a été créé, mais l'image n'a pas pu être liée. Vous pouvez la réajouter en modifiant le spectacle.");
            return;
          }
        }
      }

      setIsFormDialogOpen(false);
      setEditingShow(null);
      setEditingShowRaw(null);
    },
    [editingShow, editingShowRaw, createShow, updateShow, generateSlug]
  );

  // ============================================================================
  // Handlers categories
  // ============================================================================

  const handleAddCategory = useCallback(async (categoryName: string) => {
    const result = await createCategory(categoryName);
    if (result.error) throw new Error(result.error);
  }, [createCategory]);

  const handleRemoveCategoryById = useCallback(async (categoryId: string) => {
    const category = rawCategories.find((c) => c.id === categoryId);
    const categoryName = category?.name || 'cette catégorie';
    const usage = await checkCategoryUsage(categoryId);
    if (usage.error) throw new Error(`Impossible de vérifier l'utilisation de "${categoryName}". Veuillez réessayer.`);
    if (usage.used) throw new Error(`Impossible de supprimer "${categoryName}" : cette catégorie est utilisée par ${usage.count} spectacle(s).`);
    const result = await removeCategory(categoryId);
    if (result.error) throw new Error(result.error);
  }, [rawCategories, checkCategoryUsage, removeCategory]);

  // ============================================================================
  // Handlers publics cibles
  // ============================================================================

  const handleAddTargetAudience = useCallback(async (name: string) => {
    const result = await createTargetAudience(name);
    if (result.error) throw new Error(result.error);
  }, [createTargetAudience]);

  const handleRemoveTargetAudience = useCallback(async (id: string) => {
    const audienceName = rawTargetAudiences.find((ta) => ta.id === id)?.name || 'ce public cible';
    const usage = await checkTargetAudienceUsage(id);
    if (usage.error) throw new Error(`Impossible de vérifier l'utilisation de "${audienceName}". Veuillez réessayer.`);
    if (usage.used) throw new Error(`Impossible de supprimer "${audienceName}" : ce public cible est utilisé par ${usage.count} spectacle(s).`);
    const result = await removeTargetAudience(id);
    if (result.error) throw new Error(result.error);
  }, [rawTargetAudiences, checkTargetAudienceUsage, removeTargetAudience]);

  // ============================================================================
  // Handlers compagnies
  // ============================================================================

  const handleCreateCompany = useCallback(async (data: { name: string; email: string }): Promise<string> => {
    const result = await createCompany({ name: data.name.trim(), contact_email: data.email.trim() || null });
    if (result.error || !result.data) throw new Error(result.error || 'Erreur lors de la création de la compagnie');
    return result.data.id;
  }, [createCompany]);

  const handleCompanyCreated = useCallback((companyId: string) => {
    setNewlyCreatedCompanyId(companyId);
  }, []);

  const handleClearNewlyCreatedCompanyId = useCallback(() => {
    setNewlyCreatedCompanyId(null);
  }, []);

  // ============================================================================
  // Handlers modales
  // ============================================================================

  const handleFormDialogOpenChange = useCallback((open: boolean) => {
    setIsFormDialogOpen(open);
    if (!open) { setEditingShow(null); setEditingShowRaw(null); }
  }, []);

  const handleDeleteDialogOpenChange = useCallback((open: boolean) => {
    if (!open && !isDeleting) {
      setShowToDelete(null);
      setDeleteWarning(null);
      pendingDeleteCheckRef.current = null;
    }
  }, [isDeleting]);

  const handleDeleteFromForm = useCallback(() => {
    if (editingShow) {
      setIsFormDialogOpen(false);
      void handleDeleteClick(editingShow);
    }
  }, [editingShow, handleDeleteClick]);

  const clearOperationError = useCallback(() => { setOperationError(null); }, []);
  const handleOpenCategoriesManager = useCallback(() => { setIsCategoriesDialogOpen(true); }, []);
  const handleOpenTargetAudiencesManager = useCallback(() => { setIsAudiencesDialogOpen(true); }, []);
  const handleOpenNewCompanyDialog = useCallback(() => { setIsNewCompanyDialogOpen(true); }, []);

  return {
    isFormDialogOpen,
    handleFormDialogOpenChange,
    editingShow,
    editingShowRaw,
    viewingShowRaw,
    showToDelete,
    deleteWarning,
    isDeleting,
    handleDeleteDialogOpenChange,
    isCategoriesDialogOpen,
    setIsCategoriesDialogOpen,
    isAudiencesDialogOpen,
    setIsAudiencesDialogOpen,
    isNewCompanyDialogOpen,
    setIsNewCompanyDialogOpen,
    newlyCreatedCompanyId,
    handleClearNewlyCreatedCompanyId,
    operationError,
    clearOperationError,
    handleCreate,
    handleEdit,
    handleView,
    handleDeleteClick,
    handleConfirmDelete,
    handleFormSubmit,
    handleViewToEdit,
    handleViewToDelete,
    handleCloseView,
    handleDeleteFromForm,
    handleAddCategory,
    handleRemoveCategoryById,
    handleAddTargetAudience,
    handleRemoveTargetAudience,
    handleCreateCompany,
    handleCompanyCreated,
    handleOpenCategoriesManager,
    handleOpenTargetAudiencesManager,
    handleOpenNewCompanyDialog,
  };
}
