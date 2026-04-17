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
  UserCheck,
  ServerCog,
  BarChart3,
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
    label: 'Statistiques',
    href: '/admin/statistiques',
    icon: BarChart3,
    tooltip: 'Statistiques de réservations',
    allowedRoles: FULL_ACCESS_ROLES, // Masqué pour externe
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
    label: 'Professionnels',
    href: '/admin/professionnels',
    icon: UserCheck,
    tooltip: 'Gérer les professionnels',
    allowedRoles: FULL_ACCESS_ROLES, // Masqué pour externe
  },
  {
    label: 'Utilisateurs',
    href: '/admin/utilisateurs',
    icon: UserCog,
    tooltip: 'Gérer les utilisateurs',
    allowedRoles: FULL_ACCESS_ROLES, // Masqué pour externe
  },
  // Item « Préférences » retiré : rendu manuellement via <PreferencesSubmenu/>
  // dans admin-sidebar/index.tsx (sous-menu collapsible avec 11 sous-items).
  // Le filtrage rôle super-admin est géré par le composant lui-même.
  {
    label: 'Système',
    href: '/admin/systeme',
    icon: ServerCog,
    tooltip: 'Logs & monitoring',
    allowedRoles: ['super-admin'], // Visible uniquement pour super-admin
  },
];

/** URL de base admin */
export const ADMIN_BASE_HREF = '/admin';

/** URL page mon compte admin */
export const ADMIN_ACCOUNT_HREF = '/admin/mon-compte';

/** Sous-titre de la sidebar admin */
export const ADMIN_SUBTITLE = 'Administration';
