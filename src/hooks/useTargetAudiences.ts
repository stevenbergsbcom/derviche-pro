/**
 * Hook useTargetAudiences - Gestion des publics cibles avec Supabase
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TargetAudienceRow, TargetAudienceInsert } from '@/types/database';
import {
  getTargetAudiences,
  createTargetAudience,
  updateTargetAudience,
  deleteTargetAudience,
  isTargetAudienceUsed,
  generateTargetAudienceSlug,
} from '@/lib/services/target-audiences';
import { logger } from '@/lib/logger';

export interface UseTargetAudiencesReturn {
  targetAudiences: TargetAudienceRow[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (name: string) => Promise<{ success: boolean; data?: TargetAudienceRow; error?: string }>;
  rename: (
    id: string,
    name: string
  ) => Promise<{ success: boolean; data?: TargetAudienceRow; error?: string }>;
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
  checkUsage: (id: string) => Promise<{ used: boolean; count: number; error: string | null }>;
}

export function useTargetAudiences(): UseTargetAudiencesReturn {
  const [targetAudiences, setTargetAudiences] = useState<TargetAudienceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref pour accéder aux target audiences actuels sans dépendance dans useCallback
  const targetAudiencesRef = useRef<TargetAudienceRow[]>([]);
  
  // Synchroniser la ref avec l'état dans un useEffect
  useEffect(() => {
    targetAudiencesRef.current = targetAudiences;
  }, [targetAudiences]);

  const loadTargetAudiences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getTargetAudiences();

    if (result.error) {
      setError(result.error);
      logger.error('useTargetAudiences - Erreur chargement', { error: result.error });
    } else {
      setTargetAudiences(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadTargetAudiences();
  }, [loadTargetAudiences]);

  const create = useCallback(async (name: string) => {
    const slug = generateTargetAudienceSlug(name);
    // Utiliser la ref pour avoir la valeur actuelle
    const maxOrder = targetAudiencesRef.current.reduce((max, ta) => Math.max(max, ta.display_order), 0);
    
    const audienceData: TargetAudienceInsert = {
      name,
      slug,
      display_order: maxOrder + 1,
    };

    const result = await createTargetAudience(audienceData);

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      setTargetAudiences((prev) => [...prev, result.data!].sort((a, b) => a.display_order - b.display_order));
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Erreur inconnue' };
  }, []);

  const rename = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: 'Le nom ne peut pas être vide' };
    }

    const collision = targetAudiencesRef.current.find(
      (ta) => ta.id !== id && ta.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (collision) {
      return { success: false, error: 'Ce public cible existe déjà' };
    }

    const slug = generateTargetAudienceSlug(trimmed);
    const result = await updateTargetAudience(id, { name: trimmed, slug });

    if (result.error || !result.data) {
      return { success: false, error: result.error ?? 'Erreur inconnue' };
    }

    setTargetAudiences((prev) =>
      prev.map((ta) => (ta.id === id ? result.data! : ta))
    );
    return { success: true, data: result.data };
  }, []);

  const remove = useCallback(async (id: string) => {
    const result = await deleteTargetAudience(id);

    if (result.error) {
      return { success: false, error: result.error };
    }

    setTargetAudiences((prev) => prev.filter((ta) => ta.id !== id));
    return { success: true };
  }, []);

  const checkUsage = useCallback(async (id: string) => {
    return await isTargetAudienceUsed(id);
  }, []);

  return {
    targetAudiences,
    isLoading,
    error,
    refresh: loadTargetAudiences,
    create,
    rename,
    remove,
    checkUsage,
  };
}
