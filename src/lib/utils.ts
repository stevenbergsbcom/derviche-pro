import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalise un texte pour la recherche :
 * - Convertit en minuscules
 * - Supprime les accents (é -> e, à -> a, etc.)
 * - Conserve les espaces et caractères alphanumériques
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Vérifie si une chaîne contient une autre chaîne (insensible aux accents et à la casse)
 */
export function searchMatch(text: string, query: string): boolean {
  return normalizeForSearch(text).includes(normalizeForSearch(query));
}

/**
 * Sanitise un terme de recherche pour une utilisation sécurisée avec Supabase
 * 
 * Échappe les caractères spéciaux pour :
 * - PostgreSQL LIKE/ILIKE : %, _, \
 * - PostgREST .or() syntax : ', ", (, ), ,
 * 
 * @param searchTerm - Terme de recherche brut de l'utilisateur
 * @returns Terme de recherche sécurisé
 */
export function sanitizeSearchTerm(searchTerm: string): string {
  if (!searchTerm) return '';
  
  return searchTerm
    // Limiter la longueur (protection DoS)
    .slice(0, 100)
    // Supprimer les espaces en début/fin
    .trim()
    // Échapper le backslash EN PREMIER (sinon il échappe nos échappements)
    .replace(/\\/g, '\\\\')
    // Échapper les wildcards PostgreSQL LIKE
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    // Échapper les guillemets simples (PostgREST et SQL)
    .replace(/'/g, "''")
    // Supprimer les caractères de contrôle et spéciaux PostgREST
    .replace(/[\x00-\x1f]/g, '')
    // Supprimer les parenthèses et virgules (syntaxe .or())
    .replace(/[(),]/g, ' ')
    // Normaliser les espaces multiples
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Construit une clause OR sécurisée pour la recherche Supabase
 * 
 * @param searchTerm - Terme de recherche (sera sanitizé)
 * @param fields - Champs sur lesquels chercher
 * @returns Clause OR pour Supabase ou null si terme vide
 */
export function buildSearchOrClause(
  searchTerm: string,
  fields: string[]
): string | null {
  const sanitized = sanitizeSearchTerm(searchTerm);
  
  if (!sanitized) return null;
  
  // Construire la clause OR : field1.ilike.%term%,field2.ilike.%term%,...
  return fields
    .map(field => `${field}.ilike.%${sanitized}%`)
    .join(',');
}
