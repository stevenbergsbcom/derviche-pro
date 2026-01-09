/**
 * Service Companies - CRUD pour la table companies
 * Derviche Diffusion
 * 
 * Gère toutes les opérations sur les compagnies artistiques
 */

import { createClient } from '@/lib/supabase/client';
import type { CompanyRow, CompanyInsert, CompanyUpdate } from '@/types/database';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Compagnie avec le compteur de spectacles */
export interface CompanyWithShowsCount extends CompanyRow {
  shows_count: number;
}

/** Résultat d'une opération sur une company */
export interface CompanyResult {
  data: CompanyRow | null;
  error: string | null;
}

/** Résultat d'une opération sur plusieurs companies */
export interface CompaniesResult {
  data: CompanyRow[];
  error: string | null;
}

/** Résultat avec compteur de spectacles */
export interface CompaniesWithCountResult {
  data: CompanyWithShowsCount[];
  error: string | null;
}

// ============================================
// FONCTIONS CRUD
// ============================================

/**
 * Récupère toutes les compagnies non supprimées
 * Triées par nom
 */
export async function getCompanies(): Promise<CompaniesResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Erreur récupération companies', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getCompanies', { message });
    return { data: [], error: message };
  }
}

/**
 * Récupère toutes les compagnies avec le nombre de spectacles associés
 * Triées par nom
 * Utilise une jointure Supabase pour éviter N+1 requêtes
 */
export async function getCompaniesWithShowsCount(): Promise<CompaniesWithCountResult> {
  try {
    const supabase = createClient();
    
    // Supabase permet de compter les relations avec la syntaxe shows(count)
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        shows(count)
      `)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Erreur récupération companies avec count', error);
      return { data: [], error: error.message };
    }

    // Transformer le résultat pour avoir shows_count directement
    // Supabase retourne : { ...company, shows: [{ count: N }] }
    const companiesWithCount: CompanyWithShowsCount[] = (data || []).map((company) => {
      // Le count est dans un tableau, on extrait la valeur
      // On filtre aussi les spectacles supprimés (deleted_at != null)
      const showsArray = company.shows as { count: number }[] | null;
      const count = showsArray?.[0]?.count ?? 0;
      
      // Retirer la propriété shows et ajouter shows_count
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { shows, ...companyData } = company;
      
      return {
        ...companyData,
        shows_count: count,
      } as CompanyWithShowsCount;
    });

    return { data: companiesWithCount, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getCompaniesWithShowsCount', { message });
    return { data: [], error: message };
  }
}

/**
 * Récupère une compagnie par son ID
 */
export async function getCompanyById(id: string): Promise<CompanyResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Erreur récupération company', { id, error: error.message });
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getCompanyById', { message });
    return { data: null, error: message };
  }
}

/**
 * Crée une nouvelle compagnie
 */
export async function createCompany(company: CompanyInsert): Promise<CompanyResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('companies')
      .insert(company)
      .select()
      .single();

    if (error) {
      logger.error('Erreur création company', error);
      return { data: null, error: error.message };
    }

    logger.info(`Company créée: ${data.name} (${data.id})`);
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception createCompany', { message });
    return { data: null, error: message };
  }
}

/**
 * Met à jour une compagnie existante
 */
export async function updateCompany(id: string, company: CompanyUpdate): Promise<CompanyResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('companies')
      .update(company)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Erreur mise à jour company', { id, error: error.message });
      return { data: null, error: error.message };
    }

    logger.info(`Company mise à jour: ${data.name} (${data.id})`);
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception updateCompany', { message });
    return { data: null, error: message };
  }
}

/**
 * Supprime une compagnie (soft delete)
 * Met deleted_at à la date actuelle au lieu de supprimer réellement
 */
export async function deleteCompany(id: string): Promise<CompanyResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('companies')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Erreur suppression company', { id, error: error.message });
      return { data: null, error: error.message };
    }

    logger.info(`Company supprimée (soft): ${data.name} (${data.id})`);
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception deleteCompany', { message });
    return { data: null, error: message };
  }
}

/**
 * Vérifie si une compagnie est utilisée par des spectacles
 * Retourne true si la compagnie est utilisée, false sinon
 */
export async function isCompanyUsed(id: string): Promise<{ used: boolean; count: number; error: string | null }> {
  try {
    const supabase = createClient();
    
    const { count, error } = await supabase
      .from('shows')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', id)
      .is('deleted_at', null);

    if (error) {
      logger.error('Erreur vérification utilisation company', { id, error: error.message });
      return { used: false, count: 0, error: error.message };
    }

    return { used: (count || 0) > 0, count: count || 0, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception isCompanyUsed', { message });
    return { used: false, count: 0, error: message };
  }
}
