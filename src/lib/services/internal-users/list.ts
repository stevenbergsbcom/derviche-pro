/**
 * Fonctions de lecture pour les utilisateurs internes et compagnies
 * Derviche Diffusion - Plateforme de réservation professionnelle
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { InternalUser, InternalRole } from '@/types/database';
import type {
  ManagedRole,
  ManagedUser,
  ManagedUserResult,
  UsersListResult,
  ManagedUsersListResult,
} from './types';
import { INTERNAL_ROLES, MANAGED_ROLES } from './types';
import { isValidInternalRole, isValidManagedRole } from './helpers';

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
export async function getInternalUserById(userId: string): Promise<import('./types').UserResult> {
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

/**
 * Vérifie si un utilisateur a un rôle interne
 */
export async function isInternalUser(userId: string): Promise<boolean> {
  const result = await getInternalUserById(userId);
  return result.data !== null;
}
