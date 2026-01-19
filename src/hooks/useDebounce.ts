/**
 * Hook useDebounce - Utilitaires de debounce pour React
 * Derviche Diffusion
 *
 * Permet de retarder l'exécution d'une valeur ou d'une fonction
 * pour éviter les appels excessifs (ex: recherche en temps réel)
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

// ============================================
// HOOK useDebounce - Debounce d'une valeur
// ============================================

/**
 * Retarde la mise à jour d'une valeur.
 * Utile pour la recherche en temps réel : attend que l'utilisateur
 * arrête de taper avant de déclencher la recherche.
 *
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes (défaut: 300ms)
 * @returns La valeur debouncée
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   // Appelé seulement 300ms après la dernière frappe
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timeout pour mettre à jour la valeur après le délai
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup : annuler le timeout si la valeur change avant la fin
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// HOOK useDebounceCallback - Debounce d'une fonction
// ============================================

/**
 * Type pour une fonction debouncée avec méthode cancel
 */
export interface DebouncedFunction<T extends (...args: Parameters<T>) => void> {
  (...args: Parameters<T>): void;
  /** Annule l'exécution en attente */
  cancel: () => void;
  /** Exécute immédiatement sans attendre le délai */
  flush: () => void;
}

/**
 * Crée une version debouncée d'une fonction callback.
 * La fonction ne sera exécutée qu'après le délai spécifié
 * depuis le dernier appel.
 *
 * @param callback - La fonction à debouncer
 * @param delay - Le délai en millisecondes (défaut: 300ms)
 * @returns Une fonction debouncée avec méthodes cancel() et flush()
 *
 * @example
 * ```tsx
 * const handleSearch = useDebounceCallback((query: string) => {
 *   fetchResults(query);
 * }, 300);
 *
 * // Dans le JSX
 * <input onChange={(e) => handleSearch(e.target.value)} />
 *
 * // Pour annuler manuellement
 * handleSearch.cancel();
 *
 * // Pour exécuter immédiatement
 * handleSearch.flush();
 * ```
 */
export function useDebounceCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number = 300
): DebouncedFunction<T> {
  // Ref pour stocker le timeout
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref pour stocker les derniers arguments (pour flush)
  const argsRef = useRef<Parameters<T> | null>(null);
  // Ref pour stocker le callback actuel (évite les problèmes de closure)
  const callbackRef = useRef(callback);

  // Mettre à jour la ref du callback à chaque render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup au démontage du composant
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Créer la fonction debouncée avec les méthodes attachées
  const debouncedFn = useMemo(() => {
    const fn = ((...args: Parameters<T>) => {
      // Annuler le timeout précédent
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Stocker les arguments pour flush()
      argsRef.current = args;

      // Créer un nouveau timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timeoutRef.current = null;
        argsRef.current = null;
      }, delay);
    }) as DebouncedFunction<T>;
    
    // Attacher les méthodes directement lors de la création
    fn.cancel = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      argsRef.current = null;
    };
    
    fn.flush = () => {
      if (timeoutRef.current && argsRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        const args = argsRef.current as Parameters<T>;
        argsRef.current = null;
        callbackRef.current(...args);
      }
    };
    
    return fn;
  }, [delay]);

  return debouncedFn;
}

// ============================================
// HOOK useDebounceState - État avec debounce intégré
// ============================================

/**
 * Retour du hook useDebounceState
 */
export interface UseDebounceStateReturn<T> {
  /** Valeur immédiate (mise à jour instantanément) */
  value: T;
  /** Valeur debouncée (mise à jour après le délai) */
  debouncedValue: T;
  /** Setter pour la valeur */
  setValue: (value: T) => void;
  /** Indique si un debounce est en cours */
  isPending: boolean;
}

/**
 * Combine useState et useDebounce pour un état avec debounce intégré.
 * Fournit à la fois la valeur immédiate et la valeur debouncée.
 *
 * @param initialValue - Valeur initiale
 * @param delay - Le délai en millisecondes (défaut: 300ms)
 * @returns Objet avec value, debouncedValue, setValue et isPending
 *
 * @example
 * ```tsx
 * const { value, debouncedValue, setValue, isPending } = useDebounceState('', 300);
 *
 * // value : pour afficher dans l'input (réactif)
 * // debouncedValue : pour déclencher la recherche
 * // isPending : pour afficher un spinner
 * ```
 */
export function useDebounceState<T>(
  initialValue: T,
  delay: number = 300
): UseDebounceStateReturn<T> {
  const [value, setValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);
  const debouncedValue = useDebounce(value, delay);

  // Détecter si un debounce est en cours
  useEffect(() => {
    if (value !== debouncedValue) {
      setIsPending(true);
    } else {
      setIsPending(false);
    }
  }, [value, debouncedValue]);

  return {
    value,
    debouncedValue,
    setValue,
    isPending,
  };
}
