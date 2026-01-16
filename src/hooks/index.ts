/**
 * Index des hooks personnalisés
 * Derviche Diffusion
 */

// Hooks Supabase - Admin
export { useVenues } from './useVenues';
export type { UseVenuesReturn } from './useVenues';

export { useCompanies } from './useCompanies';
export type { UseCompaniesReturn } from './useCompanies';

export { useShows } from './useShows';
export type { UseShowsReturn } from './useShows';

export { useCategories } from './useCategories';
export type { UseCategoriesReturn } from './useCategories';

export { useTargetAudiences } from './useTargetAudiences';
export type { UseTargetAudiencesReturn } from './useTargetAudiences';

export { useInternalUsers, formatUserName, formatUserNameShort, translateRole } from './useInternalUsers';
export type { UseInternalUsersReturn, CreateUserData, UpdateUserData, OperationResult } from './useInternalUsers';

// Hooks Supabase - Public
export { usePublicCatalog } from './usePublicCatalog';
export type { UsePublicCatalogReturn } from './usePublicCatalog';
