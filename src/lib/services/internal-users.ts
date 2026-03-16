/**
 * Service pour la gestion des utilisateurs internes et compagnies (staff + company)
 * Derviche Diffusion - Plateforme de réservation professionnelle
 *
 * Gère les opérations CRUD pour les utilisateurs gérés par les admins :
 * - Internes : super-admin, admin, externe
 * - Compagnies : company (avec company_id obligatoire)
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { logActivityClient } from '@/lib/services/logs/client';
import type { InternalUser, InternalRole } from '@/types/database';

// ============================================
// TYPES
// ============================================

/** Rôles gérés par les admins (internes + company) */
export type ManagedRole = InternalRole | 'company';

/** Utilisateur géré (interne ou company) */
export interface ManagedUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: ManagedRole;
  company_id: string | null;
  company_name: string | null; // Pour affichage
  created_at: string;
  last_login_at: string | null;
  disabled_at: string | null;
}

/** Résultat d'une opération sur un utilisateur */
export interface UserResult {
  data: InternalUser | null;
  error: string | null;
}

/** Résultat d'une opération sur un utilisateur géré */
export interface ManagedUserResult {
  data: ManagedUser | null;
  error: string | null;
}

/** Résultat d'une liste d'utilisateurs internes */
export interface UsersListResult {
  data: InternalUser[];
  error: string | null;
}

/** Résultat d'une liste d'utilisateurs gérés */
export interface ManagedUsersListResult {
  data: ManagedUser[];
  error: string | null;
}

/** Rôles internes pour filtrage (sans company) */
const INTERNAL_ROLES: InternalRole[] = ['super-admin', 'admin', 'externe'];

/** Tous les rôles gérés par les admins */
const MANAGED_ROLES: ManagedRole[] = ['super-admin', 'admin', 'externe', 'company'];

/**
 * Vérifie si une valeur est un rôle interne valide (sans company)
 */
export function isValidInternalRole(role: unknown): role is InternalRole {
  return typeof role === 'string' && INTERNAL_ROLES.includes(role as InternalRole);
}

/**
 * Vérifie si une valeur est un rôle géré valide (avec company)
 */
export function isValidManagedRole(role: unknown): role is ManagedRole {
  return typeof role === 'string' && MANAGED_ROLES.includes(role as ManagedRole);
}

// ============================================
// FONCTIONS DE LECTURE
// ============================================

/**
 * Récupère tous les utilisateurs internes (super-admin, admin, externe)
 * avec jointure sur user_roles
 * 
 * @deprecated Utiliser getManagedUsers() pour inclure les compagnies
 */
export async function getInternalUsers(): Promise<UsersListResult> {
  try {
    logger.info('internal-users.getInternalUsers - Chargement des utilisateurs internes');

    const supabase = createClient();

    // Récupérer les profils avec leurs rôles via jointure
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        created_at,
        last_login_at,
        disabled_at,
        user_roles!inner (
          role
        )
      `)
      .is('deleted_at', null)
      .in('user_roles.role', INTERNAL_ROLES)
      .order('last_name', { ascending: true });

    if (error) {
      logger.error('internal-users.getInternalUsers - Erreur Supabase', { error });
      return { data: [], error: error.message };
    }

    // Transformer les données pour extraire le rôle de la jointure
    // Note: user_roles peut être un tableau ou un objet selon la config Supabase
    const users: InternalUser[] = (data || []).map((profile) => {
      // Gérer les deux cas : tableau ou objet
      const userRoles = profile.user_roles;
      let extractedRole: unknown;
      
      if (Array.isArray(userRoles) && userRoles.length > 0) {
        // Cas tableau non vide
        extractedRole = (userRoles[0] as { role?: unknown })?.role;
      } else if (userRoles && typeof userRoles === 'object' && !Array.isArray(userRoles)) {
        // Cas objet unique
        extractedRole = (userRoles as { role?: unknown }).role;
      }
      
      // Valider que le rôle est bien un InternalRole
      let role: InternalRole;
      if (isValidInternalRole(extractedRole)) {
        role = extractedRole;
      } else {
        logger.warn('internal-users.getInternalUsers - Rôle invalide ou non trouvé, fallback externe', { 
          profileId: profile.id,
          extractedRole 
        });
        role = 'externe';
      }
      
      return {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        role,
        created_at: profile.created_at,
        last_login_at: profile.last_login_at,
        disabled_at: profile.disabled_at,
      };
    });

    logger.info('internal-users.getInternalUsers - Succès', { count: users.length });
    return { data: users, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('internal-users.getInternalUsers - Exception', { error: message });
    return { data: [], error: message };
  }
}

/**
 * Récupère tous les utilisateurs gérés (internes + company)
 * avec jointure sur user_roles et companies
 */
export async function getManagedUsers(): Promise<ManagedUsersListResult> {
  try {
    logger.info('internal-users.getManagedUsers - Chargement des utilisateurs gérés');

    const supabase = createClient();

    // Récupérer les profils avec leurs rôles et compagnie via jointure
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        company_id,
        created_at,
        last_login_at,
        disabled_at,
        user_roles!inner (
          role
        ),
        companies (
          name
        )
      `)
      .is('deleted_at', null)
      .in('user_roles.role', MANAGED_ROLES)
      .order('last_name', { ascending: true });

    if (error) {
      logger.error('internal-users.getManagedUsers - Erreur Supabase', { error });
      return { data: [], error: error.message };
    }

    // Transformer les données
    const users: ManagedUser[] = (data || []).map((profile) => {
      // Extraire le rôle
      const userRoles = profile.user_roles;
      let extractedRole: unknown;
      
      if (Array.isArray(userRoles) && userRoles.length > 0) {
        extractedRole = (userRoles[0] as { role?: unknown })?.role;
      } else if (userRoles && typeof userRoles === 'object' && !Array.isArray(userRoles)) {
        extractedRole = (userRoles as { role?: unknown }).role;
      }
      
      let role: ManagedRole;
      if (isValidManagedRole(extractedRole)) {
        role = extractedRole;
      } else {
        logger.warn('internal-users.getManagedUsers - Rôle invalide, fallback externe', { 
          profileId: profile.id,
          extractedRole 
        });
        role = 'externe';
      }

      // Extraire le nom de la compagnie
      const companies = profile.companies;
      let companyName: string | null = null;
      if (companies && typeof companies === 'object' && !Array.isArray(companies)) {
        companyName = (companies as { name?: string }).name || null;
      }
      
      return {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        role,
        company_id: profile.company_id,
        company_name: companyName,
        created_at: profile.created_at,
        last_login_at: profile.last_login_at,
        disabled_at: profile.disabled_at,
      };
    });

    logger.info('internal-users.getManagedUsers - Succès', { count: users.length });
    return { data: users, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('internal-users.getManagedUsers - Exception', { error: message });
    return { data: [], error: message };
  }
}

/**
 * Récupère un utilisateur interne par son ID
 */
export async function getInternalUserById(userId: string): Promise<UserResult> {
  try {
    logger.info('internal-users.getInternalUserById - Chargement', { userId });

    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        created_at,
        last_login_at,
        disabled_at,
        user_roles!inner (
          role
        )
      `)
      .eq('id', userId)
      .is('deleted_at', null)
      .in('user_roles.role', INTERNAL_ROLES)
      .single();

    if (error) {
      logger.error('internal-users.getInternalUserById - Erreur Supabase', { error });
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Utilisateur non trouvé' };
    }

    // Gérer les deux cas : tableau ou objet
    const userRoles = data.user_roles;
    let extractedRole: unknown;
    
    if (Array.isArray(userRoles) && userRoles.length > 0) {
      // Cas tableau non vide
      extractedRole = (userRoles[0] as { role?: unknown })?.role;
    } else if (userRoles && typeof userRoles === 'object' && !Array.isArray(userRoles)) {
      // Cas objet unique
      extractedRole = (userRoles as { role?: unknown }).role;
    }
    
    // Valider que le rôle est bien un InternalRole
    let role: InternalRole;
    if (isValidInternalRole(extractedRole)) {
      role = extractedRole;
    } else {
      logger.warn('internal-users.getInternalUserById - Rôle invalide ou non trouvé, fallback externe', { 
        userId,
        extractedRole 
      });
      role = 'externe';
    }

    const user: InternalUser = {
      id: data.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      role,
      created_at: data.created_at,
      last_login_at: data.last_login_at,
      disabled_at: data.disabled_at,
    };

    logger.info('internal-users.getInternalUserById - Succès', { userId });
    return { data: user, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('internal-users.getInternalUserById - Exception', { error: message });
    return { data: null, error: message };
  }
}

/**
 * Récupère l'utilisateur company associé à une compagnie
 * Retourne null si aucun utilisateur n'est associé
 */
export async function getCompanyUser(companyId: string): Promise<ManagedUserResult> {
  try {
    logger.info('internal-users.getCompanyUser - Chargement', { companyId });

    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        company_id,
        created_at,
        last_login_at,
        disabled_at,
        user_roles!inner (
          role
        ),
        companies (
          name
        )
      `)
      .eq('company_id', companyId)
      .eq('user_roles.role', 'company')
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      logger.error('internal-users.getCompanyUser - Erreur Supabase', { error });
      return { data: null, error: error.message };
    }

    if (!data) {
      logger.info('internal-users.getCompanyUser - Aucun utilisateur trouvé', { companyId });
      return { data: null, error: null };
    }

    // Extraire le nom de la compagnie
    const companies = data.companies;
    let companyName: string | null = null;
    if (companies && typeof companies === 'object' && !Array.isArray(companies)) {
      companyName = (companies as { name?: string }).name || null;
    }

    const user: ManagedUser = {
      id: data.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      role: 'company',
      company_id: data.company_id,
      company_name: companyName,
      created_at: data.created_at,
      last_login_at: data.last_login_at,
      disabled_at: data.disabled_at,
    };

    logger.info('internal-users.getCompanyUser - Succès', { companyId, userId: user.id });
    return { data: user, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('internal-users.getCompanyUser - Exception', { error: message });
    return { data: null, error: message };
  }
}

// ============================================
// FONCTIONS D'ÉCRITURE
// ============================================

/**
 * Met à jour le rôle d'un utilisateur interne
 * Note: La création d'utilisateurs se fait via Supabase Auth
 */
export async function updateInternalUserRole(
  userId: string,
  newRole: InternalRole
): Promise<UserResult> {
  try {
    logger.info('internal-users.updateInternalUserRole - Mise à jour', { userId, newRole });

    const supabase = createClient();

    // Vérifier que l'utilisateur existe et a un rôle interne
    const existingUser = await getInternalUserById(userId);
    if (existingUser.error || !existingUser.data) {
      return { data: null, error: existingUser.error || 'Utilisateur non trouvé' };
    }

    // Mettre à jour le rôle dans user_roles
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      logger.error('internal-users.updateInternalUserRole - Erreur Supabase', { error });
      return { data: null, error: error.message };
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await getInternalUserById(userId);
    logger.info('internal-users.updateInternalUserRole - Succès', { userId, newRole });
    logActivityClient({
      category: 'system',
      action: 'user_role_update',
      success: true,
      details: {
        user_id: userId,
        new_role: newRole,
        user_name: updatedUser.data ? `${updatedUser.data.first_name ?? ''} ${updatedUser.data.last_name ?? ''}`.trim() : undefined,
      },
    });
    return updatedUser;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('internal-users.updateInternalUserRole - Exception', { error: message });
    return { data: null, error: message };
  }
}

/**
 * Met à jour le profil d'un utilisateur interne (prénom, nom, téléphone)
 */
export async function updateInternalUserProfile(
  userId: string,
  updates: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  }
): Promise<UserResult> {
  try {
    logger.info('internal-users.updateInternalUserProfile - Mise à jour', { userId, updates });

    const supabase = createClient();

    // Vérifier que l'utilisateur existe et a un rôle interne
    const existingUser = await getInternalUserById(userId);
    if (existingUser.error || !existingUser.data) {
      return { data: null, error: existingUser.error || 'Utilisateur non trouvé' };
    }

    // Mettre à jour le profil
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      logger.error('internal-users.updateInternalUserProfile - Erreur Supabase', { error });
      return { data: null, error: error.message };
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await getInternalUserById(userId);
    logger.info('internal-users.updateInternalUserProfile - Succès', { userId });
    logActivityClient({
      category: 'system',
      action: 'user_profile_update',
      success: true,
      details: {
        user_id: userId,
        user_name: updatedUser.data ? `${updatedUser.data.first_name ?? ''} ${updatedUser.data.last_name ?? ''}`.trim() : undefined,
      },
    });
    return updatedUser;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('internal-users.updateInternalUserProfile - Exception', { error: message });
    return { data: null, error: message };
  }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Vérifie si un utilisateur a un rôle interne
 */
export async function isInternalUser(userId: string): Promise<boolean> {
  const result = await getInternalUserById(userId);
  return result.data !== null;
}

/**
 * Formate le nom complet d'un utilisateur
 */
export function formatUserName(user: InternalUser | ManagedUser): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  if (user.first_name) {
    return user.first_name;
  }
  if (user.last_name) {
    return user.last_name;
  }
  return user.email;
}

/**
 * Formate le nom abrégé d'un utilisateur (Prénom N.)
 */
export function formatUserNameShort(user: InternalUser | ManagedUser): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name.charAt(0)}.`;
  }
  return formatUserName(user);
}

/**
 * Traduit un rôle en français
 */
export function translateRole(role: InternalRole | ManagedRole): string {
  const translations: Record<ManagedRole, string> = {
    'super-admin': 'Super Admin',
    'admin': 'Admin',
    'externe': 'Externe',
    'company': 'Compagnie',
  };
  return translations[role] || role;
}
