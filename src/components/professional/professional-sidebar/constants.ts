/**
 * Constantes spécifiques à la sidebar professionnelle
 * @module professional-sidebar/constants
 */

import { Calendar, User, LayoutDashboard } from 'lucide-react';
import type { NavItem } from '@/components/shared-sidebar';

/** Configuration des liens de navigation professionnels */
export const PROFESSIONAL_NAV_ITEMS: NavItem[] = [
  {
    label: 'Tableau de bord',
    href: '/professional',
    icon: LayoutDashboard,
    tooltip: 'Tableau de bord',
  },
  {
    label: 'Mes réservations',
    href: '/professional/reservations',
    icon: Calendar,
    tooltip: 'Voir mes réservations',
  },
  {
    label: 'Mon compte',
    href: '/professional/mon-compte',
    icon: User,
    tooltip: 'Gérer mon compte',
  },
];

/** URL de base professionnelle */
export const PROFESSIONAL_BASE_HREF = '/professional';

/** Sous-titre de la sidebar professionnelle */
export const PROFESSIONAL_SUBTITLE = 'Espace Professionnel';

/** Label du rôle pour les professionnels */
export const PROFESSIONAL_ROLE_LABEL = 'Professionnel';
