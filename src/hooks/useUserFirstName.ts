/**
 * Hook - User First Name
 * Derviche Diffusion
 *
 * Récupère le prénom de l'utilisateur connecté
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Résultat du hook useUserFirstName
 */
interface UseUserFirstNameResult {
  /** Prénom de l'utilisateur (null si non chargé ou non disponible) */
  firstName: string | null;
  /** État de chargement */
  isLoading: boolean;
}

/**
 * Hook pour récupérer le prénom de l'utilisateur connecté
 * 
 * @returns Prénom et état de chargement
 * 
 * @example
 * ```tsx
 * const { firstName, isLoading } = useUserFirstName();
 * return <h1>Bonjour{firstName ? ` ${firstName}` : ''}</h1>;
 * ```
 */
export function useUserFirstName(): UseUserFirstNameResult {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (profile?.first_name) {
          setFirstName(profile.first_name);
        }
      } catch (err) {
        // Silencieux - ce n'est pas critique
        logger.error('Erreur récupération profil utilisateur', {
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUserProfile();
  }, []);

  return { firstName, isLoading };
}
