/**
 * Constantes pour SpectacleFormDialog
 * Derviche Diffusion - Session 101
 */

import type { SpectacleFormData } from './types';

/**
 * Valeurs par défaut du formulaire spectacle
 */
export const DEFAULT_FORM_DATA: SpectacleFormData = {
  slug: '',
  title: '',
  companyId: '',
  categoryIds: [],
  targetAudienceIds: [],
  description: '',
  shortDescription: null,
  imageUrl: null,
  imageFile: null,
  imageRemoved: false,
  duration: null,
  status: 'published',
  priceType: 'free',
  period: '',
  dervisheManagerId: '',
  invitationPolicy: '',
  maxParticipantsPerBooking: undefined,
  closureDates: '',
  folderUrl: '',
  teaserUrl: '',
  captationAvailable: false,
  captationUrl: '',
  photoFolderUrl: '',
  dervisheSiteUrl: '',
};

/**
 * Options de statut pour le select
 */
export const STATUS_OPTIONS = [
  { value: 'published', label: 'Disponible' },
  { value: 'draft', label: 'Bientôt' },
  { value: 'archived', label: 'Terminé' },
] as const;
