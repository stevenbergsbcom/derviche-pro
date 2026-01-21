/**
 * Hook useCurrentUserRole
 * Récupère l'utilisateur connecté et son rôle
 * Derviche Diffusion
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// Types de rôles possibles
export type UserRole = 'super-admin' | 'admin' | 'externe' | 'programmateur' | 'company' | null;

// Rôles considérés comme "admin" (ne doivent pas réserver côté public)
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
  /** L'utilisateur a-t-il un rôle admin (super-admin, admin, externe) ? */
  isAdminRole: boolean;
  /** L'utilisateur est-il connecté ? */
  isAuthenticated: boolean;
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

  const fetchUserRole = useCallback(async () => {
    setIsLoading(true);
    setError(null);

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
          // No rows returned
          setRole(null);
        } else {
          setError(roleError.message);
        }
        setIsLoading(false);
        return;
      }

      setRole(roleData?.role as UserRole || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
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
    isAdminRole: role !== null && ADMIN_ROLES.includes(role),
    isAuthenticated: user !== null,
    refresh: fetchUserRole,
  };
}
