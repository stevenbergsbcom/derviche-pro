/**
 * Types - Admin Dashboard Page
 * Derviche Diffusion
 *
 * Types spécifiques à l'interface du dashboard admin
 */

import type { LucideIcon } from 'lucide-react';

// ============================================
// LIENS RAPIDES
// ============================================

/**
 * Configuration d'un lien d'accès rapide
 */
export interface QuickLinkItem {
  /** URL de destination */
  href: string;
  /** Icône Lucide à afficher */
  icon: LucideIcon;
  /** Titre du lien */
  title: string;
  /** Description courte */
  description: string;
  /** Nécessite un accès complet (super-admin/admin) ? */
  requiresFullAccess?: boolean;
  /** Ouvrir le lien dans un nouvel onglet ? */
  openInNewTab?: boolean;
}

// ============================================
// STATISTIQUES
// ============================================

/**
 * Props pour une carte de statistique
 */
export interface StatCardProps {
  /** Titre de la statistique */
  title: string;
  /** Valeur principale à afficher */
  value: string | number;
  /** Description complémentaire */
  description?: string;
  /** Icône Lucide */
  icon: LucideIcon;
  /** Tendance optionnelle */
  trend?: {
    value: number;
    label: string;
  };
}

// ============================================
// SKELETONS
// ============================================

/**
 * Props pour le skeleton de liste
 */
export interface ListSkeletonProps {
  /** Nombre d'éléments à afficher */
  count?: number;
}

// ============================================
// COMPOSANTS DE LISTE
// ============================================

/**
 * Props pour la carte des prochains créneaux
 */
export interface UpcomingSlotsCardProps {
  /** Données des créneaux */
  slots: import('@/lib/services/admin-dashboard/types').AdminUpcomingSlot[];
  /** État de chargement */
  isLoading: boolean;
  /** Accès complet (super-admin/admin) */
  hasFullAccess: boolean;
}

/**
 * Props pour la carte des réservations récentes
 */
export interface RecentReservationsCardProps {
  /** Données des réservations */
  reservations: import('@/lib/services/admin-dashboard/types').AdminRecentReservation[];
  /** État de chargement */
  isLoading: boolean;
  /** Accès complet (super-admin/admin) */
  hasFullAccess: boolean;
}

// ============================================
// COULEURS
// ============================================

/**
 * Variantes de badge pour le taux de remplissage
 */
export type OccupancyBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
