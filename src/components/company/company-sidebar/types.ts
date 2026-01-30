/**
 * Types spécifiques à la sidebar company
 * @module company-sidebar/types
 */

import type { BaseSidebarUserData } from '@/components/shared-sidebar';

/**
 * Données utilisateur spécifiques à la sidebar company
 */
export interface CompanySidebarUserData extends BaseSidebarUserData {
  /** Nom de la compagnie associée */
  companyName: string | null;
}
