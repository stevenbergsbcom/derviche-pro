/**
 * Utilitaires pour SpectacleViewDialog
 * Derviche Diffusion - Session 110
 * 
 * Fonctions pures sans effets de bord
 */

import type { ShowCategoryRow, TargetAudienceRow, ShowPriceType } from '@/types/database';
import type { DervisheUser } from './types';

// ============================================
// HELPERS DE RÉSOLUTION DE NOMS
// ============================================

/**
 * Obtient les noms de catégories à partir des IDs
 */
export function getCategoryNames(
  categoryIds: string[],
  categories: ShowCategoryRow[]
): string[] {
  return categoryIds
    .map(id => categories.find(c => c.id === id)?.name)
    .filter((name): name is string => name !== undefined);
}

/**
 * Obtient les noms des publics cibles à partir des IDs
 */
export function getTargetAudienceNames(
  audienceIds: string[],
  targetAudiences: TargetAudienceRow[]
): string[] {
  return audienceIds
    .map(id => targetAudiences.find(ta => ta.id === id)?.name)
    .filter((name): name is string => name !== undefined);
}

/**
 * Obtient le nom complet du responsable Derviche
 */
export function getManagerName(
  managerId: string | null,
  dervisheUsers: DervisheUser[]
): string | null {
  if (!managerId) return null;
  const manager = dervisheUsers.find(u => u.id === managerId);
  return manager ? `${manager.firstName} ${manager.lastName}` : null;
}

// ============================================
// HELPERS DE FORMATAGE
// ============================================

/**
 * Formate le tarif pour l'affichage
 */
export function formatPrice(
  priceType: ShowPriceType,
  priceAmount: number | null
): string {
  if (priceType === 'free') {
    return 'Gratuit';
  }
  return priceAmount 
    ? `Payant sur place (${priceAmount}€)` 
    : 'Payant sur place';
}

/**
 * Formate la durée pour l'affichage
 */
export function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  return `${minutes} min`;
}

/**
 * Génère le texte pour le compteur de représentations
 */
export function formatRepresentationsCount(count: number): string {
  if (count === 0) {
    return 'Aucune représentation programmée';
  }
  return `${count} représentation${count > 1 ? 's' : ''} programmée${count > 1 ? 's' : ''}`;
}
