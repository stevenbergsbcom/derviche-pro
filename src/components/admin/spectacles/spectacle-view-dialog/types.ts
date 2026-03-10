/**
 * Types pour SpectacleViewDialog
 * Derviche Diffusion - Session 110
 */

import type { ShowWithRelations } from '@/lib/services/shows';
import type { ShowCategoryRow, TargetAudienceRow, ShowStatus, ShowPriceType } from '@/types/database';

// ============================================
// TYPES MÉTIER
// ============================================

/**
 * Utilisateur Derviche simplifié pour l'affichage
 */
export interface DervisheUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

// ============================================
// PROPS DU DIALOG PRINCIPAL
// ============================================

export interface SpectacleViewDialogProps {
  /** Le spectacle à afficher (null = modale fermée) */
  show: ShowWithRelations | null;
  /** Liste des catégories pour afficher les noms */
  categories: ShowCategoryRow[];
  /** Liste des publics cibles pour afficher les noms */
  targetAudiences: TargetAudienceRow[];
  /** Callback quand la modale se ferme */
  onClose: () => void;
  /** Callback pour passer en mode édition */
  onEdit: () => void;
  /** Callback pour supprimer */
  onDelete: () => void | Promise<void>;
  /** Callback pour copier le lien */
  onCopyLink: (show: ShowWithRelations) => void | Promise<void>;
  /** ID du spectacle dont le lien vient d'être copié */
  copiedShowId: string | null;
  /** Callback pour naviguer vers les représentations */
  onNavigateToRepresentations: (showId: string) => void;
  /** Liste des utilisateurs Derviche pour afficher le responsable */
  dervisheUsers: DervisheUser[];
}

// ============================================
// PROPS DES COMPOSANTS ENFANTS
// ============================================

/**
 * Props pour le header (image + titre)
 */
export interface ShowHeaderProps {
  title: string;
  companyName: string;
  imageUrl: string | null;
}

/**
 * Props pour les métadonnées (catégories, statut, slug)
 */
export interface ShowMetadataProps {
  showId: string;
  slug: string;
  status: ShowStatus;
  categoryNames: string[];
  audienceNames: string[];
  copiedShowId: string | null;
  onCopyLink: () => void;
}

/**
 * Props pour la section infos générales
 */
export interface GeneralInfoSectionProps {
  durationMinutes: number | null;
  priceType: ShowPriceType;
  priceAmount: number | null;
  period: string | null;
  closureDates: string | null;
}

/**
 * Props pour la section représentations
 */
export interface RepresentationsSectionProps {
  representationsCount: number;
  onNavigate: () => void;
}

/**
 * Props pour la section politique de réservation
 */
export interface ReservationPolicySectionProps {
  maxReservationsPerBooking: number;
  invitationPolicy: string | null;
}

/**
 * Props pour la section médias/ressources
 */
export interface MediaResourcesSectionProps {
  folderUrl: string | null;
  teaserUrl: string | null;
  captationAvailable: boolean;
  captationUrl: string | null;
  /** URL du dossier photo — S170 */
  photoFolderUrl: string | null;
}

/**
 * Props pour la section gestion Derviche
 */
export interface DervisheManagementSectionProps {
  managerName: string | null;
}

/**
 * Props pour le footer avec les actions
 */
export interface DialogFooterActionsProps {
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
}

// ============================================
// TYPES DÉRIVÉS POUR LE HOOK
// ============================================

/**
 * Données dérivées du spectacle pour l'affichage
 */
export interface DerivedShowData {
  categoryNames: string[];
  audienceNames: string[];
  managerName: string | null;
}
