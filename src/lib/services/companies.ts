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

/** Compagnie avec le compteur de spectacles et statut accès */
export interface CompanyWithShowsCount extends CompanyRow {
  shows_count: number;
  /** La compagnie a-t-elle un utilisateur configuré ? */
  has_user: boolean;
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
 * Récupère toutes les compagnies avec le nombre de spectacles actifs associés
 * et le statut de l'accès utilisateur
 * Triées par nom
 */
export async function getCompaniesWithShowsCount(): Promise<CompaniesWithCountResult> {
  try {
    const supabase = createClient();
    
    // Requête 1: Récupérer les compagnies actives
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (companiesError) {
      logger.error('Erreur récupération companies', companiesError);
      return { data: [], error: companiesError.message };
    }

    if (!companies || companies.length === 0) {
      return { data: [], error: null };
    }

    const companyIds = companies.map(c => c.id);

    // Requête 2: Compter les spectacles ACTIFS (non supprimés) par compagnie
    const { data: showsData, error: showsError } = await supabase
      .from('shows')
      .select('company_id')
      .is('deleted_at', null)
      .in('company_id', companyIds);

    if (showsError) {
      logger.error('Erreur comptage shows', showsError);
    }

    // Requête 3: Récupérer les utilisateurs avec rôle 'company' (non supprimés)
    // Important: On joint user_roles pour ne compter que les vrais utilisateurs company
    // et éviter de compter les admins ou externes qui auraient un company_id assigné
    
    // Étape 3a: Récupérer les user_ids qui ont le rôle 'company'
    const { data: companyRoleUsers, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'company');

    if (rolesError) {
      logger.error('Erreur récupération rôles company', rolesError);
    }

    const companyUserIds = (companyRoleUsers || []).map(u => u.user_id);

    // Étape 3b: Récupérer les profils avec company_id parmi ceux qui ont le rôle 'company'
    let usersData: { company_id: string | null }[] = [];

    if (companyUserIds.length > 0) {
      const { data, error: usersError } = await supabase
        .from('profiles')
        .select('company_id')
        .is('deleted_at', null)
        .not('company_id', 'is', null)
        .in('id', companyUserIds)
        .in('company_id', companyIds);
      
      if (usersError) {
        logger.error('Erreur récupération users company', usersError);
      }
      usersData = data || [];
    }

    // Agréger les counts par company_id
    const showsCountMap: Record<string, number> = {};
    (showsData || []).forEach(show => {
      showsCountMap[show.company_id] = (showsCountMap[show.company_id] || 0) + 1;
    });

    // Set des company_id qui ont un utilisateur
    const companiesWithUser = new Set<string>();
    (usersData || []).forEach(user => {
      if (user.company_id) {
        companiesWithUser.add(user.company_id);
      }
    });

    // Fusionner les données
    const companiesWithCount: CompanyWithShowsCount[] = companies.map(company => ({
      ...company,
      shows_count: showsCountMap[company.id] || 0,
      has_user: companiesWithUser.has(company.id),
    }));

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
