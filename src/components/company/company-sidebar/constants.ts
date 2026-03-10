/**
 * Constantes spécifiques à la sidebar company
 * @module company-sidebar/constants
 */

import { LayoutDashboard, Film, Calendar } from 'lucide-react';
import type { NavItem } from '@/components/shared-sidebar';

/** Configuration des liens de navigation company */
export const COMPANY_NAV_ITEMS: NavItem[] = [
  {
    label: 'Tableau de bord',
    href: '/company',
    icon: LayoutDashboard,
    tooltip: 'Tableau de bord',
  },
  {
    label: 'Mes spectacles',
    href: '/company/spectacles',
    icon: Film,
    tooltip: 'Voir mes spectacles',
  },
  {
    label: 'Réservations',
    href: '/company/reservations',
    icon: Calendar,
    tooltip: 'Voir les réservations',
  },
];

/** URL de base company */
export const COMPANY_BASE_HREF = '/company';

/** URL page mon compte company */
export const COMPANY_ACCOUNT_HREF = '/company/mon-compte';

/** Sous-titre de la sidebar company */
export const COMPANY_SUBTITLE = 'Espace Compagnie';

/** Label du rôle pour company */
export const COMPANY_ROLE_LABEL = 'Compagnie';
