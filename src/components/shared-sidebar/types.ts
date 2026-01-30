/**
 * Types partagés pour les sidebars
 * @module shared-sidebar/types
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Configuration d'un item de navigation
 */
export interface NavItem {
  /** Label affiché dans le menu */
  label: string;
  /** URL de destination */
  href: string;
  /** Icône Lucide à afficher */
  icon: LucideIcon;
  /** Tooltip affiché en mode collapsed (optionnel, défaut = label) */
  tooltip?: string;
}

/**
 * Configuration d'un groupe de navigation
 */
export interface NavGroup {
  /** Titre du groupe (optionnel) */
  title?: string;
  /** Items de navigation dans ce groupe */
  items: NavItem[];
}

/**
 * Données utilisateur de base pour la sidebar
 */
export interface BaseSidebarUserData {
  /** Prénom de l'utilisateur */
  firstName: string | null;
  /** Nom de l'utilisateur */
  lastName: string | null;
  /** Email de l'utilisateur */
  email: string;
}

/**
 * Props communes pour les composants de sidebar
 */
export interface SidebarLogoProps {
  /** URL de base pour le lien du logo */
  baseHref: string;
  /** Sous-titre affiché sous le logo */
  subtitle: string;
}

/**
 * Props pour le lien externe "Voir le site"
 */
export interface SidebarExternalLinkProps {
  /** URL de destination */
  href?: string;
  /** Label du lien */
  label?: string;
}

/**
 * Props pour les informations utilisateur
 */
export interface SidebarUserInfoProps {
  /** Indique si les données sont en cours de chargement */
  isLoading: boolean;
  /** Label du rôle à afficher */
  roleLabel: string;
  /** Nom d'affichage de l'utilisateur */
  displayName: string;
}

/**
 * Props pour le lien "Mon compte"
 */
export interface SidebarAccountLinkProps {
  /** URL de la page mon compte */
  href: string;
}

/**
 * Variante de sidebar pour le thème
 */
export type SidebarVariant = 'admin' | 'company' | 'professional';
