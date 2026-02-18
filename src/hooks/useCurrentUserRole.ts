/**
 * Hook useCurrentUserRole
 * Récupère l'utilisateur connecté et son rôle
 * Derviche Diffusion
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// Types de rôles possibles
export type UserRole = 'super-admin' | 'admin' | 'externe' | 'professional' | 'company' | null;

// Rôles considérés comme "admin" (ne doivent pas réserver côté public)
// Rôles internes qui ne peuvent pas réserver côté public
const ADMIN_ROLES: UserRole[] = ['super-admin', 'admin', 'externe'];

interface UseCurrentUserRoleReturn {
  /** Utilisateur Supabase connecté (ou null) */
  user: User | null;
  /** Rôle de l'utilisateur (ou null si non connecté ou pas de rôle) */
  role: UserRole;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** 
   * L'utilisateur a-t-il un rôle admin (super-admin, admin, externe) ?
   * SÉCURITÉ: Retourne true si authentifié + erreur fetch rôle (fail-secure)
   */
  isAdminRole: boolean;
  /** L'utilisateur est-il connecté ? */
  isAuthenticated: boolean;
  /** Erreur lors du fetch du rôle (utile pour afficher un message) */
  hasRoleFetchError: boolean;
  /** Rafraîchir les données */
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer l'utilisateur courant et son rôle
 * Utile pour adapter l'affichage selon le type d'utilisateur
 */
export function useCurrentUserRole(): UseCurrentUserRoleReturn {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRoleFetchError, setHasRoleFetchError] = useState(false);

  const fetchUserRole = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasRoleFetchError(false);

    try {
      const supabase = createClient();

      // Récupérer l'utilisateur connecté
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        // Pas d'erreur si simplement non connecté
        if (userError.message !== 'Auth session missing!') {
          setError(userError.message);
        }
        setUser(null);
        setRole(null);
        setIsLoading(false);
        return;
      }

      if (!currentUser) {
        setUser(null);
        setRole(null);
        setIsLoading(false);
        return;
      }

      setUser(currentUser);

      // Récupérer le rôle de l'utilisateur
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .single();

      if (roleError) {
        // Pas de rôle trouvé = peut-être un utilisateur sans rôle assigné
        if (roleError.code === 'PGRST116') {
          // No rows returned - pas une erreur, juste pas de rôle
          setRole(null);
        } else {
          // Vraie erreur de fetch
          setError(roleError.message);
          setHasRoleFetchError(true);
        }
        setIsLoading(false);
        return;
      }

      setRole(roleData?.role as UserRole || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      // SÉCURITÉ: Marquer comme erreur de fetch
      // Note: On ne peut pas savoir ici si l'utilisateur est connecté car l'erreur
      // peut survenir avant ou après le fetch auth. Le flag sera utilisé avec user dans le return.
      setHasRoleFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    void fetchUserRole();
  }, [fetchUserRole]);

  // Écouter les changements d'authentification
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Recharger le rôle si la session change
      if (session?.user) {
        void fetchUserRole();
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  return {
    user,
    role,
    isLoading,
    error,
    // SÉCURITÉ (fail-secure): Si authentifié + erreur fetch rôle, on considère comme admin
    // Cela bloque l'accès au formulaire public par précaution
    isAdminRole: (role !== null && ADMIN_ROLES.includes(role)) || (user !== null && hasRoleFetchError),
    isAuthenticated: user !== null,
    hasRoleFetchError,
    refresh: fetchUserRole,
  };
}
