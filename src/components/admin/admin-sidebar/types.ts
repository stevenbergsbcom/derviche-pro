/**
 * Types spécifiques à la sidebar admin
 * @module admin-sidebar/types
 */

import type { InternalRole } from '@/types/database';
import type { BaseSidebarUserData, NavItem } from '@/components/shared-sidebar';

/**
 * Item de navigation avec contrôle d'accès par rôle
 */
export interface AdminNavItem extends NavItem {
  /** Rôles autorisés à voir ce lien. Si undefined, visible par tous les rôles internes */
  allowedRoles?: InternalRole[];
}

/**
 * Données utilisateur spécifiques à la sidebar admin
 */
export interface AdminSidebarUserData extends BaseSidebarUserData {
  /** Rôle de l'utilisateur */
  role: InternalRole | null;
  /** Label du rôle pour l'affichage */
  roleLabel: string;
}
