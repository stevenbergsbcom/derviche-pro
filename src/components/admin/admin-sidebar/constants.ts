/**
 * Constantes spécifiques à la sidebar admin
 * @module admin-sidebar/constants
 */

import {
  LayoutDashboard,
  Calendar,
  Film,
  MapPin,
  Users,
  UserCog,
  Settings,
} from 'lucide-react';
import type { InternalRole } from '@/types/database';
import type { AdminNavItem } from './types';

/** Rôles avec accès admin complet */
export const FULL_ACCESS_ROLES: InternalRole[] = ['super-admin', 'admin'];

/** Labels des rôles pour l'affichage */
export const ROLE_LABELS: Record<InternalRole, string> = {
  'super-admin': 'Super Admin',
  admin: 'Admin',
  externe: 'Externe',
};

/** Label par défaut si rôle non trouvé */
export const DEFAULT_ROLE_LABEL = 'Utilisateur';

/** Configuration des liens de navigation admin avec permissions */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Tableau de bord',
    href: '/admin',
    icon: LayoutDashboard,
    tooltip: 'Tableau de bord',
    // Visible par tous les rôles internes
  },
  {
    label: 'Réservations',
    href: '/admin/reservations',
    icon: Calendar,
    tooltip: 'Gérer les réservations',
    // Visible par tous les rôles internes
  },
  {
    label: 'Spectacles',
    href: '/admin/spectacles',
    icon: Film,
    tooltip: 'Gérer les spectacles',
    // Visible par tous les rôles internes
  },
  {
    label: 'Lieux',
    href: '/admin/lieux',
    icon: MapPin,
    tooltip: 'Gérer les lieux',
    allowedRoles: FULL_ACCESS_ROLES, // Masqué pour externe
  },
  {
    label: 'Compagnies',
    href: '/admin/compagnies',
    icon: Users,
    tooltip: 'Gérer les compagnies',
    allowedRoles: FULL_ACCESS_ROLES, // Masqué pour externe
  },
  {
    label: 'Utilisateurs',
    href: '/admin/utilisateurs',
    icon: UserCog,
    tooltip: 'Gérer les utilisateurs',
    allowedRoles: FULL_ACCESS_ROLES, // Masqué pour externe
  },
  {
    label: 'Préférences',
    href: '/admin/preferences',
    icon: Settings,
    tooltip: 'Paramètres',
    allowedRoles: ['super-admin'], // Visible uniquement pour super-admin
  },
];

/** URL de base admin */
export const ADMIN_BASE_HREF = '/admin';

/** URL page mon compte admin */
export const ADMIN_ACCOUNT_HREF = '/admin/mon-compte';

/** Sous-titre de la sidebar admin */
export const ADMIN_SUBTITLE = 'Administration';
