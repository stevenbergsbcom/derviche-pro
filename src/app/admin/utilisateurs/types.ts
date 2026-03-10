/**
 * Types pour la page Admin Utilisateurs
 * Derviche Diffusion
 * S158 - Ajout tri alphabétique
 */

import type { InternalRole } from '@/types/database';
import type { SortDirection } from '@/components/admin';
import type { 
  ManagedUser, 
  ManagedRole,
  CreateManagedUserData,
  UpdateManagedUserData,
} from '@/hooks/useManagedUsers';
import type { UserFormData, CreateUserFormData } from '@/components/admin/utilisateurs';

// ============================================
// RÉEXPORTS
// ============================================

export type { 
  ManagedUser, 
  ManagedRole, 
  CreateManagedUserData, 
  UpdateManagedUserData,
  UserFormData,
  CreateUserFormData,
  InternalRole,
};

// ============================================
// TYPES LOCAUX
// ============================================

/** Filtre par rôle incluant "all" */
export type RoleFilter = ManagedRole | 'all';

/** Compteurs par rôle */
export interface RoleCounts {
  'super-admin': number;
  'admin': number;
  'externe': number;
  'company': number;
}

/** État des modales */
export interface ModalsState {
  isFormDialogOpen: boolean;
  editingUser: ManagedUser | null;
  userToDelete: ManagedUser | null;
  viewingUser: ManagedUser | null;
}

/** État des erreurs */
export interface ErrorsState {
  formError: string | null;
  deleteError: string | null;
}

/** Props pour le composant RoleSummaryBadges */
export interface RoleSummaryBadgesProps {
  counts: RoleCounts;
}

/** Props pour le composant UsersFilters */
export interface UsersFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilter: RoleFilter;
  onRoleFilterChange: (value: RoleFilter) => void;
}

/** Props pour les actions sur un utilisateur */
export interface UserActionsProps {
  user: ManagedUser;
  currentUserId: string | null;
  currentUserRole: InternalRole | null;
  isSubmitting: boolean;
  onView: (user: ManagedUser) => void;
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
  onToggleStatus: (user: ManagedUser) => void;
  canDelete: (user: ManagedUser) => boolean;
  canToggleStatus: (user: ManagedUser) => boolean;
}

/** Props pour le composant UsersTable */
export interface UsersTableProps {
  users: ManagedUser[];
  currentUserId: string | null;
  currentUserRole: InternalRole | null;
  isSubmitting: boolean;
  hasFilters: boolean;
  formatName: (user: ManagedUser) => string;
  onView: (user: ManagedUser) => void;
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
  onToggleStatus: (user: ManagedUser) => void;
  canDelete: (user: ManagedUser) => boolean;
  canToggleStatus: (user: ManagedUser) => boolean;
}

/** Props pour le composant UsersMobileCards (identique à UsersTable) */
export type UsersMobileCardsProps = UsersTableProps;

/** Props pour le composant UsersModals */
export interface UsersModalsProps {
  formatName: (user: ManagedUser) => string;
  isFormDialogOpen: boolean;
  onFormDialogChange: (open: boolean) => void;
  editingUser: ManagedUser | null;
  onFormSubmit: (formData: UserFormData, isEditing: boolean) => Promise<void>;
  onCreateUser: (formData: CreateUserFormData) => Promise<void>;
  isSubmitting: boolean;
  formError: string | null;
  viewingUser: ManagedUser | null;
  onCloseView: () => void;
  onViewToEdit: () => void;
  onViewToDelete: () => void;
  canDeleteViewing: boolean;
  userToDelete: ManagedUser | null;
  onDeleteDialogChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
  deleteError: string | null;
  canDeleteUser: (user: ManagedUser) => boolean;
}

/** Retour du hook useUtilisateursPage */
export interface UseUtilisateursPageReturn {
  users: ManagedUser[];
  filteredUsers: ManagedUser[];
  roleCounts: RoleCounts;
  isLoading: boolean;
  error: string | null;
  currentUserId: string | null;
  currentUserRole: InternalRole | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  roleFilter: RoleFilter;
  setRoleFilter: (value: RoleFilter) => void;
  hasFilters: boolean;
  // Tri
  sortDir: SortDirection;
  toggleSortDir: () => void;
  isSubmitting: boolean;
  formError: string | null;
  deleteError: string | null;
  isFormDialogOpen: boolean;
  editingUser: ManagedUser | null;
  userToDelete: ManagedUser | null;
  viewingUser: ManagedUser | null;
  refresh: () => Promise<void>;
  handleCreate: () => void;
  handleEdit: (user: ManagedUser) => void;
  handleView: (user: ManagedUser) => void;
  handleCloseView: () => void;
  handleDeleteClick: (user: ManagedUser) => void;
  handleConfirmDelete: () => Promise<void>;
  handleViewToEdit: () => void;
  handleViewToDelete: () => void;
  handleFormDialogChange: (open: boolean) => void;
  handleDeleteDialogChange: (open: boolean) => void;
  handleCreateUser: (formData: CreateUserFormData) => Promise<void>;
  handleFormSubmit: (formData: UserFormData, isEditing: boolean) => Promise<void>;
  handleToggleStatus: (user: ManagedUser) => Promise<void>;
  canDeleteUser: (user: ManagedUser) => boolean;
  canToggleStatus: (user: ManagedUser) => boolean;
  formatName: (user: ManagedUser) => string;
}
