/**
 * Types partagés - Composants PWA
 * Derviche Diffusion
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Props pour EmptyState générique
 * Permet de personnaliser l'icône, le titre et le message
 */
export interface EmptyStateProps {
  /** Icône Lucide à afficher */
  icon: LucideIcon;
  /** Titre principal */
  title: string;
  /** Message descriptif */
  message: string;
  /** Label aria pour accessibilité */
  ariaLabel?: string;
}

/**
 * Props pour ErrorState générique
 */
export interface ErrorStateProps {
  /** Message d'erreur à afficher */
  message: string;
  /** Callback appelé lors du clic sur "Réessayer" */
  onRetry: () => void | Promise<void>;
  /** Titre personnalisé (défaut: "Erreur de chargement") */
  title?: string;
}

/**
 * Props pour LoadingOverlay générique
 */
export interface LoadingOverlayProps {
  /** Contrôle la visibilité de l'overlay (défaut: true) */
  visible?: boolean;
  /** Label aria pour accessibilité */
  ariaLabel?: string;
}
