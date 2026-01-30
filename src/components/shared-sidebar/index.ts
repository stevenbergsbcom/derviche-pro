/**
 * Exports partagés pour les sidebars
 * @module shared-sidebar
 */

// Types
export type {
  NavItem,
  NavGroup,
  BaseSidebarUserData,
  SidebarLogoProps,
  SidebarExternalLinkProps,
  SidebarUserInfoProps,
  SidebarAccountLinkProps,
  SidebarVariant,
} from './types';

// Constantes
export {
  LOGO_PATH,
  LOGO_DIMENSIONS,
  LOGO_ALT,
  EXTERNAL_LINK_LABEL,
  EXTERNAL_LINK_HREF,
  ACCOUNT_LINK_LABEL,
  LOGOUT_LABEL,
  LOADING_TEXT,
  CONNECTED_AS_PREFIX,
  SIDEBAR_SUBTITLES,
} from './constants';

// Hooks
export {
  useSidebarUserData,
  type UseSidebarUserDataConfig,
  type UseSidebarUserDataResult,
} from './hooks/useSidebarUserData';

// Utilitaires
export { isRouteActive } from './utils';

// Composants
export { SidebarLogo } from './components/SidebarLogo';
export { SidebarExternalLink } from './components/SidebarExternalLink';
export { SidebarUserInfo } from './components/SidebarUserInfo';
export { SidebarAccountLink } from './components/SidebarAccountLink';
export { SidebarLogoutButton } from './components/SidebarLogoutButton';
