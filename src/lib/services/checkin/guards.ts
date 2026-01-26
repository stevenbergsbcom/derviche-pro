/**
 * Type Guards pour le service Check-in
 * Derviche Diffusion
 * 
 * Ces fonctions permettent de valider les données reçues de Supabase
 * et d'assurer un typage correct à l'exécution.
 */

import type { SlotHostedBy } from '@/types/database';
import { VALID_HOSTED_BY } from './constants';

/**
 * Vérifie si une valeur est une compagnie valide
 */
export function isValidCompany(data: unknown): data is { id: string; name: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { name: unknown }).name === 'string'
  );
}

/**
 * Vérifie si une valeur est un venue valide
 */
export function isValidVenue(data: unknown): data is { id: string; name: string; city?: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { name: unknown }).name === 'string'
  );
}

/**
 * Vérifie si une valeur est un show valide
 */
export function isValidShow(data: unknown): data is { id: string; slug: string; title: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'slug' in data &&
    'title' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { slug: unknown }).slug === 'string' &&
    typeof (data as { title: unknown }).title === 'string'
  );
}

/**
 * Vérifie si une valeur est un hosted_by valide
 */
export function isValidHostedBy(value: unknown): value is SlotHostedBy {
  return typeof value === 'string' && VALID_HOSTED_BY.includes(value as SlotHostedBy);
}

/**
 * Vérifie si une valeur est un slot brut valide (depuis Supabase)
 */
export function isValidRawSlot(data: unknown): data is {
  id: string;
  date: string;
  time: string;
  hosted_by: string;
  hosted_by_id: string | null;
  venues: unknown;
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'date' in data &&
    'time' in data &&
    'hosted_by' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { date: unknown }).date === 'string' &&
    typeof (data as { time: unknown }).time === 'string'
  );
}

/**
 * Vérifie si une réponse RPC create_admin_reservation est valide
 */
export function isValidRpcResult(data: unknown): data is { 
  success: boolean; 
  reservation_id?: string; 
  error?: string 
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    typeof (data as { success: unknown }).success === 'boolean'
  );
}
