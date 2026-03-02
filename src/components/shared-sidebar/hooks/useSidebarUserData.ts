/**
 * Hook générique pour charger les données utilisateur dans la sidebar
 * @module shared-sidebar/hooks/useSidebarUserData
 */

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { BaseSidebarUserData } from '../types';

/**
 * Configuration du hook
 */
export interface UseSidebarUserDataConfig<T extends BaseSidebarUserData> {
  /** Query Supabase pour charger le profil (colonnes à sélectionner) */
  selectQuery: string;
  /** Fonction pour transformer les données du profil en données sidebar */
  transformData: (profile: Record<string, unknown>, userId: string) => T;
  /** Nom du contexte pour les logs */
  contextName: string;
}

/**
 * Résultat du hook
 */
export interface UseSidebarUserDataResult<T extends BaseSidebarUserData> {
  /** Données utilisateur chargées */
  userData: T | null;
  /** Indique si le chargement est en cours */
  isLoading: boolean;
  /** Nom d'affichage formaté */
  displayName: string;
}

/**
 * Hook générique pour charger les données utilisateur
 * Permet de personnaliser les colonnes sélectionnées et la transformation
 */
export function useSidebarUserData<T extends BaseSidebarUserData>(
  config: UseSidebarUserDataConfig<T>
): UseSidebarUserDataResult<T> {
  const { selectQuery, transformData, contextName } = config;
  const [userData, setUserData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // NOTE : selectQuery et contextName doivent être des constantes stables (définis hors du render).
  // transformData doit être mémoïsé avec useCallback dans le hook appelant.
  // Sans cela, l'effet se réexécute à chaque render et provoque des refetch inutiles.
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select(selectQuery)
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          logger.error(`Erreur chargement profil sidebar ${contextName}`, {
            error: error.message,
          });
          setIsLoading(false);
          return;
        }

        if (profile) {
          // Cast via unknown pour satisfaire TypeScript avec les types Supabase
          const profileData = profile as unknown as Record<string, unknown>;
          const transformedData = transformData(profileData, user.id);
          setUserData(transformedData);
        }
      } catch (error) {
        logger.error(
          `Exception chargement utilisateur sidebar ${contextName}`,
          error instanceof Error ? error : { message: 'Erreur inconnue' }
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextName, selectQuery]); // transformData volontairement exclu : doit être stable via useCallback

  // Formater le nom d'affichage
  const displayName = useMemo(() => {
    if (!userData) return 'Chargement...';

    if (userData.firstName || userData.lastName) {
      return `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
    }

    return userData.email;
  }, [userData]);

  return {
    userData,
    isLoading,
    displayName,
  };
}
