/**
 * Hook pour la gestion du formulaire spectacle
 * Derviche Diffusion - Session 101
 * 
 * @important Les callbacks parents (onSubmit, onOpenChange) doivent être stables
 * (mémorisés avec useCallback) pour éviter des re-renders inutiles.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ShowWithRelations } from '@/lib/services/shows';
import type { SpectacleFormData, UseSpectacleFormReturn } from '../types';
import { DEFAULT_FORM_DATA } from '../constants';
import { slugify } from '../utils';

interface UseSpectacleFormOptions {
  /** Contrôle l'ouverture de la modale */
  open: boolean;
  /** Spectacle en cours d'édition (null = mode création) */
  editingShow: ShowWithRelations | null;
  /** 
   * Callback à la soumission 
   * @important Doit être stable (useCallback) pour éviter re-renders
   */
  onSubmit: (data: SpectacleFormData, isEditing: boolean) => void | Promise<void>;
  /** 
   * Callback pour fermer la modale 
   * @important Doit être stable (useCallback) pour éviter re-renders
   */
  onOpenChange: (open: boolean) => void;
  /** ID de la compagnie nouvellement créée */
  newlyCreatedCompanyId?: string | null;
  /** Callback pour reset l'ID de la compagnie nouvellement créée */
  onClearNewlyCreatedCompanyId?: () => void;
}

/**
 * Hook gérant toute la logique du formulaire spectacle
 */
export function useSpectacleForm({
  open,
  editingShow,
  onSubmit,
  onOpenChange,
  newlyCreatedCompanyId,
  onClearNewlyCreatedCompanyId,
}: UseSpectacleFormOptions): UseSpectacleFormReturn {
  // ============================================
  // ÉTATS
  // ============================================
  const [formData, setFormData] = useState<SpectacleFormData>(DEFAULT_FORM_DATA);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref pour éviter la génération du slug au premier effet en mode création
  // Cela permet de ne pas écraser un slug existant lors de l'init
  const isInitializedRef = useRef(false);
  
  // Refs pour stabiliser les callbacks et éviter les re-renders en cascade
  const onSubmitRef = useRef(onSubmit);
  const onOpenChangeRef = useRef(onOpenChange);
  
  // Mettre à jour les refs quand les callbacks changent
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);
  
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  // ============================================
  // EFFETS
  // ============================================

  // Auto-sélection de la nouvelle compagnie créée
  useEffect(() => {
    if (newlyCreatedCompanyId && open) {
      setFormData((prev) => ({ ...prev, companyId: newlyCreatedCompanyId }));
      onClearNewlyCreatedCompanyId?.();
    }
  }, [newlyCreatedCompanyId, open, onClearNewlyCreatedCompanyId]);

  // Initialiser le formulaire quand on ouvre la modale
  useEffect(() => {
    if (open) {
      isInitializedRef.current = true;
      if (editingShow) {
        // Mode édition - convertir ShowWithRelations vers SpectacleFormData
        setFormData({
          slug: editingShow.slug,
          title: editingShow.title,
          companyId: editingShow.company_id,
          categoryIds: editingShow.category_ids || [],
          targetAudienceIds: editingShow.target_audience_ids || [],
          description: editingShow.long_description || '',
          shortDescription: editingShow.short_description,
          imageUrl: editingShow.image_url,
          imageFile: null,
          imageRemoved: false,
          duration: editingShow.duration_minutes,
          status: editingShow.status,
          priceType: editingShow.price_type,
          period: editingShow.period || '',
          dervisheManagerId: editingShow.derviche_manager_id || '',
          invitationPolicy: editingShow.invitation_policy || '',
          maxParticipantsPerBooking: editingShow.max_reservations_per_booking,
          closureDates: editingShow.closure_dates || '',
          folderUrl: editingShow.folder_url || '',
          teaserUrl: editingShow.teaser_url || '',
          captationAvailable: editingShow.captation_available,
          captationUrl: editingShow.captation_url || '',
        });
      } else {
        // Mode création
        setFormData(DEFAULT_FORM_DATA);
      }
      setError(null);
    } else {
      isInitializedRef.current = false;
    }
  }, [open, editingShow]);

  // Auto-générer le slug depuis le titre (seulement en mode création)
  useEffect(() => {
    if (!editingShow && formData.title && isInitializedRef.current) {
      setFormData((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [formData.title, editingShow]);

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Met à jour un champ du formulaire
   */
  const updateField = useCallback(<K extends keyof SpectacleFormData>(
    field: K,
    value: SpectacleFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Gère le changement de catégorie (toggle)
   */
  const handleCategoryChange = useCallback((categoryId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: checked
        ? [...prev.categoryIds, categoryId]
        : prev.categoryIds.filter((id) => id !== categoryId),
    }));
  }, []);

  /**
   * Gère le changement de public cible (toggle)
   */
  const handleTargetAudienceChange = useCallback((audienceId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      targetAudienceIds: checked
        ? [...prev.targetAudienceIds, audienceId]
        : prev.targetAudienceIds.filter((id) => id !== audienceId),
    }));
  }, []);

  /**
   * Gère le changement d'image
   */
  const handleImageChange = useCallback((file: File | null) => {
    if (file) {
      // Nouvelle image sélectionnée
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imageRemoved: false,
      }));
    } else {
      // Image supprimée
      setFormData((prev) => ({
        ...prev,
        imageFile: null,
        imageUrl: null,
        imageRemoved: true,
      }));
    }
  }, []);

  /**
   * Ferme la modale (utilise ref pour stabilité)
   */
  const handleClose = useCallback(() => {
    onOpenChangeRef.current(false);
  }, []);

  /**
   * Réinitialise le formulaire
   */
  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setIsExpanded(false);
    setError(null);
  }, []);

  /**
   * Soumet le formulaire (utilise refs pour stabilité)
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation des champs requis
    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    if (!formData.companyId) {
      setError('Veuillez sélectionner une compagnie');
      return;
    }

    if (formData.categoryIds.length === 0) {
      setError('Veuillez sélectionner au moins une catégorie');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitRef.current(formData, editingShow !== null);
      handleClose();
    } catch (err) {
      // Message générique pour l'utilisateur, log détaillé en dev
      console.error('[SpectacleForm] Erreur soumission:', err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Une erreur est survenue lors de l\'enregistrement'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingShow, handleClose]);

  // ============================================
  // RETOUR
  // ============================================

  return {
    // État
    formData,
    isExpanded,
    isSubmitting,
    error,

    // Setters
    setIsExpanded,
    setError,

    // Handlers
    updateField,
    handleCategoryChange,
    handleTargetAudienceChange,
    handleImageChange,

    // Actions
    handleSubmit,
    handleClose,
    resetForm,
  };
}
