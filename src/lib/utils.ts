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
