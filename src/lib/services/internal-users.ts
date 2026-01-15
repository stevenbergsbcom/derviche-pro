/**
 * Service pour la gestion des utilisateurs internes (staff)
 * Derviche Diffusion - Plateforme de réservation professionnelle
 *
 * Gère les opérations CRUD pour les utilisateurs internes (super-admin, admin, externe-dd)
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { InternalUser, InternalRole, UserRoleRow } from '@/types/database';

// ============================================
// TYPES
// ============================================

/** Résultat d'une opération sur un utilisateur */
export interface UserResult {
  data: InternalUser | null;
  error: string | null;
}

/** Résultat d'une liste d'utilisateurs */
export interface UsersListResult {
  data: InternalUser[];
  error: string | null;
}

/** Rôles internes pour filtrage */
const INTERNAL_ROLES: InternalRole[] = ['super-admin', 'admin', 'externe-dd'];

// ============================================
// FONCTIONS DE LECTURE
// ============================================

/**
 * Récupère tous les utilisateurs internes (super-admin, admin, externe-dd)
 * avec jointure sur user_roles
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
      let role: InternalRole | undefined;
      
      if (Array.isArray(userRoles) && userRoles.length > 0) {
        // Cas tableau non vide
        role = (userRoles as UserRoleRow[])[0]?.role as InternalRole | undefined;
      } else if (userRoles && typeof userRoles === 'object' && !Array.isArray(userRoles)) {
        // Cas objet unique
        role = (userRoles as unknown as UserRoleRow).role as InternalRole | undefined;
      }
      
      // Fallback si role est undefined (tableau vide ou structure inattendue)
      if (!role) {
        logger.warn('internal-users.getInternalUsers - Rôle non trouvé, fallback externe-dd', { 
          profileId: profile.id 
        });
        role = 'externe-dd';
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
    let role: InternalRole | undefined;
    
    if (Array.isArray(userRoles) && userRoles.length > 0) {
      // Cas tableau non vide
      role = (userRoles as UserRoleRow[])[0]?.role as InternalRole | undefined;
    } else if (userRoles && typeof userRoles === 'object' && !Array.isArray(userRoles)) {
      // Cas objet unique
      role = (userRoles as unknown as UserRoleRow).role as InternalRole | undefined;
    }
    
    // Fallback si role est undefined (tableau vide ou structure inattendue)
    if (!role) {
      logger.warn('internal-users.getInternalUserById - Rôle non trouvé, fallback externe-dd', { userId });
      role = 'externe-dd';
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
    };

    logger.info('internal-users.getInternalUserById - Succès', { userId });
    return { data: user, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('internal-users.getInternalUserById - Exception', { error: message });
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
export function formatUserName(user: InternalUser): string {
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
export function formatUserNameShort(user: InternalUser): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name.charAt(0)}.`;
  }
  return formatUserName(user);
}

/**
 * Traduit un rôle en français
 */
export function translateRole(role: InternalRole): string {
  const translations: Record<InternalRole, string> = {
    'super-admin': 'Super Admin',
    'admin': 'Admin',
    'externe-dd': 'Externe DD',
  };
  return translations[role] || role;
}
