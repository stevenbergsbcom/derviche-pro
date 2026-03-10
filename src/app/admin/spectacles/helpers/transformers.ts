/**
 * Fonctions de transformation de données pour admin/spectacles
 */

import type { ShowWithRelations } from '@/lib/services/shows';
import type { CompanyWithShowsCount } from '@/lib/services/companies';
import type {
  ShowCategoryRow,
  TargetAudienceRow,
  InternalUser,
  ShowStatus,
  ShowPriceType,
} from '@/types/database';
import type {
  ShowForDisplay,
  CompanyOption,
  DervisheUserOption,
  CategoryOption,
  TargetAudienceOption,
} from '../types';

/**
 * Transforme un ShowWithRelations en ShowForDisplay
 */
export function transformShowToDisplay(
  show: ShowWithRelations,
  categories: ShowCategoryRow[]
): ShowForDisplay {
  // Mapper les category_ids vers les noms de catégories
  const categoryNames = show.category_ids
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter((name): name is string => name !== undefined);

  return {
    id: show.id,
    slug: show.slug,
    title: show.title,
    companyId: show.company_id,
    companyName: show.company_name,
    categories: categoryNames,
    targetAudienceIds: show.target_audience_ids,
    description: show.long_description || undefined,
    shortDescription: show.short_description,
    imageUrl: show.image_url,
    duration: show.duration_minutes,
    status: show.status as ShowStatus,
    priceType: show.price_type as ShowPriceType,
    period: show.period || undefined,
    dervisheManagerId: show.derviche_manager_id || undefined,
    invitationPolicy: show.invitation_policy || undefined,
    maxParticipantsPerBooking: show.max_reservations_per_booking,
    closureDates: show.closure_dates || undefined,
    representationsCount: show.representations_count,
    folderUrl: show.folder_url || undefined,
    teaserUrl: show.teaser_url || undefined,
    captationAvailable: show.captation_available,
    captationUrl: show.captation_url || undefined,
    photoFolderUrl: show.photo_folder_url || undefined,
  };
}

/**
 * Transforme une liste de ShowWithRelations en ShowForDisplay[]
 */
export function transformShowsToDisplay(
  shows: ShowWithRelations[],
  categories: ShowCategoryRow[]
): ShowForDisplay[] {
  return shows.map((show) => transformShowToDisplay(show, categories));
}

/**
 * Transforme les catégories pour les selects
 */
export function transformCategoriesToOptions(
  categories: ShowCategoryRow[]
): CategoryOption[] {
  return categories.map((c) => ({ id: c.id, name: c.name }));
}

/**
 * Transforme les publics cibles pour les selects
 */
export function transformTargetAudiencesToOptions(
  targetAudiences: TargetAudienceRow[]
): TargetAudienceOption[] {
  return targetAudiences.map((ta) => ({ id: ta.id, name: ta.name }));
}

/**
 * Transforme les compagnies pour les selects
 * Accepte CompanyWithShowsCount[] (qui étend CompanyRow)
 * Note: contactEmail est toujours string dans CompanyRow
 */
export function transformCompaniesToOptions(
  companies: CompanyWithShowsCount[]
): CompanyOption[] {
  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    contactEmail: c.contact_email,
    contactPhone: c.contact_phone,
  }));
}

/**
 * Transforme les utilisateurs internes pour les selects
 * Filtre uniquement les utilisateurs actifs (non désactivés)
 */
export function transformInternalUsersToOptions(
  users: InternalUser[]
): DervisheUserOption[] {
  return users
    .filter((u) => !u.disabled_at) // Exclure les utilisateurs désactivés
    .map((u) => ({
      id: u.id,
      firstName: u.first_name || '',
      lastName: u.last_name || '',
      role: u.role,
    }));
}

/**
 * Génère l'URL publique d'un spectacle
 */
export function getShowUrl(slug: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/spectacle/${slug}`;
}
