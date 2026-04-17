/**
 * Constants - Admin Dashboard Page
 * Derviche Diffusion
 *
 * Constantes pour le dashboard admin
 */

import {
  Calendar,
  Theater,
  MapPin,
  Ticket,
  UserCheck,
  Building2,
  Settings,
} from 'lucide-react';
import type { QuickLinkItem } from './types';

// ============================================
// LIENS D'ACCÈS RAPIDE
// ============================================

/**
 * Configuration des liens d'accès rapide avec permissions
 * Les liens avec requiresFullAccess=true ne sont visibles que pour super-admin/admin
 */
export const QUICK_LINKS: QuickLinkItem[] = [
  {
    href: '/admin/spectacles',
    icon: Theater,
    title: 'Spectacles',
    description: 'Voir les spectacles',
  },
  {
    href: '/admin/reservations',
    icon: Ticket,
    title: 'Réservations',
    description: 'Voir les réservations',
  },
  {
    href: '/admin/lieux',
    icon: MapPin,
    title: 'Lieux',
    description: 'Gérer les salles',
    requiresFullAccess: true,
  },
  {
    href: '/admin/utilisateurs',
    icon: UserCheck,
    title: 'Utilisateurs',
    description: 'Gérer les comptes',
    requiresFullAccess: true,
  },
  {
    href: '/admin/compagnies',
    icon: Building2,
    title: 'Compagnies',
    description: 'Gérer les compagnies',
    requiresFullAccess: true,
  },
  {
    href: '/accueil',
    icon: Calendar,
    title: 'Check-in',
    description: 'Accueil des invités',
    openInNewTab: true,
  },
  {
    href: '/admin/preferences',
    icon: Settings,
    title: 'Préférences',
    description: 'Configuration',
    requiresFullAccess: true,
  },
];

// ============================================
// VALEURS PAR DÉFAUT
// ============================================

/** Nombre d'éléments par défaut dans les skeletons */
export const DEFAULT_SKELETON_COUNT = 5;

/** Capacité représentant "illimité" dans la base */
export const UNLIMITED_CAPACITY = 999999;

/** Symbole d'affichage pour capacité illimitée */
export const UNLIMITED_DISPLAY = '∞';
