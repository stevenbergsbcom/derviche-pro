/**
 * Hook useCategories - Gestion des catégories avec Supabase
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ShowCategoryRow, ShowCategoryInsert } from '@/types/database';
import {
  getCategories,
  createCategory,
  deleteCategory,
  isCategoryUsed,
  generateCategorySlug,
} from '@/lib/services/categories';
import { logger } from '@/lib/logger';

export interface UseCategoriesReturn {
  categories: ShowCategoryRow[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (name: string) => Promise<{ success: boolean; data?: ShowCategoryRow; error?: string }>;
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
  checkUsage: (id: string) => Promise<{ used: boolean; count: number; error: string | null }>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<ShowCategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref pour accéder aux catégories actuelles sans dépendance dans useCallback
  const categoriesRef = useRef<ShowCategoryRow[]>([]);
  
  // Synchroniser la ref avec l'état dans un useEffect
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getCategories();

    if (result.error) {
      setError(result.error);
      logger.error('useCategories - Erreur chargement', { error: result.error });
    } else {
      setCategories(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const create = useCallback(async (name: string) => {
    const slug = generateCategorySlug(name);
    // Utiliser la ref pour avoir la valeur actuelle
    const maxOrder = categoriesRef.current.reduce((max, c) => Math.max(max, c.display_order), 0);
    
    const categoryData: ShowCategoryInsert = {
      name,
      slug,
      display_order: maxOrder + 1,
    };

    const result = await createCategory(categoryData);

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      setCategories((prev) => [...prev, result.data!].sort((a, b) => a.display_order - b.display_order));
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Erreur inconnue' };
  }, []);

  const remove = useCallback(async (id: string) => {
    const result = await deleteCategory(id);

    if (result.error) {
      return { success: false, error: result.error };
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
    return { success: true };
  }, []);

  const checkUsage = useCallback(async (id: string) => {
    return await isCategoryUsed(id);
  }, []);

  return {
    categories,
    isLoading,
    error,
    refresh: loadCategories,
    create,
    remove,
    checkUsage,
  };
}
