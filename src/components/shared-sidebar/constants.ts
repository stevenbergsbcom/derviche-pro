/**
 * Constantes partagées pour les sidebars
 * @module shared-sidebar/constants
 */

/** Chemin du logo par défaut (version blanche pour fonds sombres) */
export const LOGO_PATH = '/images/logos/logo-theatre-blanc.svg';

/** Chemin du logo par défaut (version sombre pour fonds clairs) */
export const LOGO_PATH_DARK = '/images/logos/logo-theatre-noir.svg';

/** Dimensions du logo */
export const LOGO_DIMENSIONS = {
  width: 180,
  height: 75,
} as const;

/** Alt text du logo */
export const LOGO_ALT = 'Logo de l\'organisation';

/** Label par défaut pour le lien externe */
export const EXTERNAL_LINK_LABEL = 'Voir le site';

/** URL par défaut pour le lien externe */
export const EXTERNAL_LINK_HREF = '/';

/** Label pour le lien "Mon compte" */
export const ACCOUNT_LINK_LABEL = 'Mon compte';

/** Label pour le bouton de déconnexion */
export const LOGOUT_LABEL = 'Déconnexion';

/** Texte affiché pendant le chargement */
export const LOADING_TEXT = 'Chargement...';

/** Préfixe pour "Connecté en tant que" */
export const CONNECTED_AS_PREFIX = 'Connecté en tant que';

/** Labels des sous-titres par variante de sidebar */
export const SIDEBAR_SUBTITLES: Record<string, string> = {
  admin: 'Administration',
  company: 'Espace Compagnie',
  professional: 'Espace Professionnel',
} as const;
