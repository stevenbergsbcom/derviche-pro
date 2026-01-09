/**
 * Hook useCompanies - Gestion des compagnies avec Supabase
 * Derviche Diffusion
 * 
 * Encapsule le service companies et gère les états React
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CompanyInsert, CompanyUpdate } from '@/types/database';
import {
  getCompaniesWithShowsCount,
  createCompany,
  updateCompany,
  deleteCompany,
  isCompanyUsed,
  type CompanyWithShowsCount,
} from '@/lib/services/companies';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface UseCompaniesReturn {
  /** Liste des compagnies avec leur nombre de spectacles */
  companies: CompanyWithShowsCount[];
  /** Chargement en cours */
  isLoading: boolean;
  /** Message d'erreur */
  error: string | null;
  /** Recharger les données */
  refresh: () => Promise<void>;
  /** Créer une compagnie */
  create: (company: CompanyInsert) => Promise<{ success: boolean; data?: CompanyWithShowsCount; error?: string }>;
  /** Mettre à jour une compagnie */
  update: (id: string, company: CompanyUpdate) => Promise<{ success: boolean; data?: CompanyWithShowsCount; error?: string }>;
  /** Supprimer une compagnie */
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
  /** Vérifier si une compagnie est utilisée */
  checkUsage: (id: string) => Promise<{ used: boolean; count: number; error: string | null }>;
}

// ============================================
// HOOK
// ============================================

export function useCompanies(): UseCompaniesReturn {
  const [companies, setCompanies] = useState<CompanyWithShowsCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les compagnies avec leur compteur de spectacles
  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getCompaniesWithShowsCount();

    if (result.error) {
      setError(result.error);
      logger.error('useCompanies - Erreur chargement', { error: result.error });
    } else {
      setCompanies(result.data);
    }

    setIsLoading(false);
  }, []);

  // Charger au montage
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Créer une compagnie
  const create = useCallback(async (company: CompanyInsert) => {
    const result = await createCompany(company);

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      // Ajouter la nouvelle compagnie à la liste avec shows_count = 0
      const newCompanyWithCount: CompanyWithShowsCount = {
        ...result.data,
        shows_count: 0,
      };
      
      setCompanies((prev) => 
        [...prev, newCompanyWithCount].sort((a, b) => a.name.localeCompare(b.name))
      );
      return { success: true, data: newCompanyWithCount };
    }

    return { success: false, error: 'Erreur inconnue lors de la création' };
  }, []);

  // Mettre à jour une compagnie
  const update = useCallback(async (id: string, company: CompanyUpdate) => {
    const result = await updateCompany(id, company);

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      // Trouver le shows_count existant avant de mettre à jour
      const existingCompany = companies.find(c => c.id === id);
      const updatedCompanyWithCount: CompanyWithShowsCount = {
        ...result.data,
        shows_count: existingCompany?.shows_count ?? 0,
      };
      
      // Mettre à jour la compagnie dans la liste
      setCompanies((prev) =>
        prev
          .map((c) => c.id === id ? updatedCompanyWithCount : c)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      
      return { success: true, data: updatedCompanyWithCount };
    }

    return { success: false, error: 'Erreur inconnue lors de la mise à jour' };
  }, [companies]);

  // Supprimer une compagnie
  const remove = useCallback(async (id: string) => {
    const result = await deleteCompany(id);

    if (result.error) {
      return { success: false, error: result.error };
    }

    // Retirer la compagnie de la liste
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    return { success: true };
  }, []);

  // Vérifier si une compagnie est utilisée
  const checkUsage = useCallback(async (id: string) => {
    const result = await isCompanyUsed(id);
    if (result.error) {
      // En cas d'erreur, on considère la compagnie comme utilisée par sécurité
      logger.error('Erreur vérification usage company', { error: result.error });
      return { used: true, count: 0, error: result.error };
    }
    return { used: result.used, count: result.count, error: null };
  }, []);

  return {
    companies,
    isLoading,
    error,
    refresh: loadCompanies,
    create,
    update,
    remove,
    checkUsage,
  };
}
