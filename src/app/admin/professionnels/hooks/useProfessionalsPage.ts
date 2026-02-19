/**
 * Hook useProfessionalsPage - Logique de la page Admin Professionnels
 * Derviche Diffusion
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { searchMatch } from '@/lib/utils';
import { useProfessionals } from '@/hooks/useProfessionals';

import type {
  Professional,
  UpdateProfessionalData,
  StatusFilter,
  DrawerState,
  DrawerTab,
  UseProfessionalsPageReturn,
} from '../types';

import { MESSAGES } from '../constants';

// ============================================
// HOOK
// ============================================

export function useProfessionalsPage(): UseProfessionalsPageReturn {
  const {
    professionals,
    isLoading,
    error,
    refresh,
    update,
    remove,
    toggleStatus,
    formatName,
    formatNameShort,
  } = useProfessionals();

  // ============================================
  // FILTRES
  // ============================================

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [cityFilter, setCityFilter] = useState('');

  const hasFilters = useMemo(
    () => searchQuery.trim() !== '' || statusFilter !== 'all' || cityFilter !== '',
    [searchQuery, statusFilter, cityFilter]
  );

  /** Liste des villes uniques disponibles (triées alphabétiquement) */
  const availableCities = useMemo(() => {
    const cities = professionals
      .map((p) => p.city)
      .filter((c): c is string => Boolean(c && c.trim() !== ''));
    return [...new Set(cities)].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [professionals]);

  const filteredProfessionals = useMemo(() => {
    let result = professionals;

    // Filtre statut
    if (statusFilter === 'active') {
      result = result.filter((p) => p.disabled_at === null);
    } else if (statusFilter === 'inactive') {
      result = result.filter((p) => p.disabled_at !== null);
    }

    // Filtre ville
    if (cityFilter !== '') {
      result = result.filter(
        (p) => p.city && p.city.toLowerCase() === cityFilter.toLowerCase()
      );
    }

    // Filtre recherche texte (nom, prénom, email, structure, ville, fonction)
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      result = result.filter(
        (p) =>
          searchMatch(p.email, q) ||
          searchMatch(p.first_name ?? '', q) ||
          searchMatch(p.last_name ?? '', q) ||
          searchMatch(p.structure ?? '', q) ||
          searchMatch(p.city ?? '', q) ||
          searchMatch(p.function ?? '', q)
      );
    }

    return result;
  }, [professionals, searchQuery, statusFilter, cityFilter]);

  // ============================================
  // DRAWER
  // ============================================

  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    professional: null,
    activeTab: 'info',
    isEditing: false,
  });

  const openDrawer = useCallback((professional: Professional) => {
    setDrawerState({
      isOpen: true,
      professional,
      activeTab: 'info',
      isEditing: false,
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isOpen: false, isEditing: false }));
    // Nettoyer après l'animation de fermeture
    setTimeout(() => {
      setDrawerState({
        isOpen: false,
        professional: null,
        activeTab: 'info',
        isEditing: false,
      });
    }, 300);
  }, []);

  const setDrawerTab = useCallback((tab: DrawerTab) => {
    setDrawerState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const setDrawerEditing = useCallback((editing: boolean) => {
    setDrawerState((prev) => ({ ...prev, isEditing: editing }));
  }, []);

  // ============================================
  // SUPPRESSION
  // ============================================

  const [professionalToDelete, setProfessionalToDelete] =
    useState<Professional | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleDeleteClick = useCallback((professional: Professional) => {
    setDeleteError(null);
    setProfessionalToDelete(professional);
  }, []);

  const handleDeleteDialogChange = useCallback((open: boolean) => {
    if (!open) {
      setProfessionalToDelete(null);
      setDeleteError(null);
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!professionalToDelete) return;

    setIsSubmitting(true);
    setDeleteError(null);

    const result = await remove(professionalToDelete.id);
    setIsSubmitting(false);

    if (result.success) {
      setProfessionalToDelete(null);
      closeDrawer();
      toast.success(MESSAGES.DELETE_SUCCESS);
    } else {
      setDeleteError(result.error ?? 'Erreur lors de la suppression');
      toast.error(result.error ?? 'Erreur lors de la suppression');
    }
  }, [professionalToDelete, remove, closeDrawer]);

  // ============================================
  // TOGGLE STATUT
  // ============================================

  const handleToggleStatus = useCallback(
    async (professional: Professional) => {
      setIsSubmitting(true);
      const newDisabledState = professional.disabled_at === null;
      const result = await toggleStatus(professional.id, newDisabledState);
      setIsSubmitting(false);

      if (result.success) {
        // Rafraîchir le professionnel dans le drawer si ouvert
        setDrawerState((prev) => {
          if (prev.professional?.id === professional.id) {
            return {
              ...prev,
              professional: {
                ...professional,
                disabled_at: newDisabledState ? new Date().toISOString() : null,
              },
            };
          }
          return prev;
        });
        toast.success(
          newDisabledState
            ? MESSAGES.TOGGLE_INACTIVE_SUCCESS
            : MESSAGES.TOGGLE_ACTIVE_SUCCESS
        );
      } else {
        toast.error(result.error ?? 'Erreur lors du changement de statut');
      }
    },
    [toggleStatus]
  );

  // ============================================
  // MISE À JOUR
  // ============================================

  const handleUpdate = useCallback(
    async (id: string, data: UpdateProfessionalData) => {
      setIsSubmitting(true);
      setFormError(null);

      const result = await update(id, data);
      setIsSubmitting(false);

      if (result.success) {
        setDrawerEditing(false);
        toast.success(MESSAGES.UPDATE_SUCCESS);
        // Merge les données dans le drawer via le state fonctionnel
        // (évite la stale closure sur `professionals`)
        setDrawerState((prev) => {
          if (!prev.professional || prev.professional.id !== id) return prev;
          return {
            ...prev,
            professional: { ...prev.professional, ...data },
          };
        });
      } else {
        setFormError(result.error ?? 'Erreur lors de la mise à jour');
        toast.error(result.error ?? 'Erreur lors de la mise à jour');
      }
    },
    [update, setDrawerEditing]
  );

  // ============================================
  // RETOUR
  // ============================================

  return {
    professionals,
    filteredProfessionals,
    availableCities,
    isLoading,
    error,

    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    cityFilter,
    setCityFilter,
    hasFilters,

    drawerState,
    openDrawer,
    closeDrawer,
    setDrawerTab,
    setDrawerEditing,

    professionalToDelete,
    deleteError,
    handleDeleteClick,
    handleConfirmDelete,
    handleDeleteDialogChange,

    isSubmitting,
    formError,
    handleToggleStatus,
    handleUpdate,

    refresh,
    formatName,
    formatNameShort,
  };
}
