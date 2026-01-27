/**
 * Types locaux pour la page Accueil (Liste des spectacles)
 * Derviche Diffusion - PWA Check-in
 */

// ============================================
// TYPES DE DONNÉES
// ============================================

/** Slot affiché dans une card spectacle */
export interface DisplaySlot {
  date: string;
  time: string;
  venueName: string;
}

/** Spectacle affiché dans la liste */
export interface ShowListItem {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  company: {
    name: string;
  };
  upcomingSlotsCount: number;
  pastSlotsCount: number;
  nextSlot: DisplaySlot | null;
  lastSlot: DisplaySlot | null;
}

// ============================================
// TYPES UI
// ============================================

/** Onglet actif (cohérent avec [showSlug]/page.tsx) */
export type TabFilter = 'upcoming' | 'past';

/** Mode d'affichage d'une card spectacle */
export type DisplayMode = 'upcoming' | 'past';

// ============================================
// TYPES PROPS COMPOSANTS
// ============================================

/** Props pour ShowCard */
export interface ShowCardProps {
  show: ShowListItem;
  /** Mode d'affichage : 'upcoming' affiche nextSlot, 'past' affiche lastSlot */
  displayMode: DisplayMode;
  onClick: () => void;
}

/** Props pour HeaderSection */
export interface HeaderSectionProps {
  isAdmin: boolean;
  role: string | null;
  companyName: string | null;
}

/** Props pour TabFilters */
export interface TabFiltersProps {
  activeTab: TabFilter;
  /** Handler reçoit un string de Radix, validation dans le hook */
  onTabChange: (value: string) => void;
  upcomingCount: number;
  pastCount: number;
}

/** Props pour ShowsList */
export interface ShowsListProps {
  shows: ShowListItem[];
  displayMode: DisplayMode;
  onShowClick: (slug: string) => void;
  /** Pour l'onglet "upcoming" : spectacles d'aujourd'hui */
  todayShows?: ShowListItem[];
  /** Pour l'onglet "upcoming" : spectacles à venir (hors aujourd'hui) */
  laterShows?: ShowListItem[];
}

/** Props pour EmptyTabMessage */
export interface EmptyTabMessageProps {
  displayMode: DisplayMode;
}

// ============================================
// TYPE GUARDS
// ============================================

/** Vérifie qu'un objet est un DisplaySlot valide */
export function isDisplaySlot(obj: unknown): obj is DisplaySlot {
  if (!obj || typeof obj !== 'object') return false;
  const slot = obj as Record<string, unknown>;
  return (
    typeof slot.date === 'string' &&
    typeof slot.time === 'string' &&
    typeof slot.venueName === 'string'
  );
}

/** Vérifie qu'un objet est un ShowListItem valide */
export function isShowListItem(obj: unknown): obj is ShowListItem {
  if (!obj || typeof obj !== 'object') return false;
  const show = obj as Record<string, unknown>;
  return (
    typeof show.id === 'string' &&
    typeof show.slug === 'string' &&
    typeof show.title === 'string' &&
    (show.imageUrl === null || typeof show.imageUrl === 'string') &&
    typeof show.company === 'object' &&
    show.company !== null &&
    typeof (show.company as Record<string, unknown>).name === 'string' &&
    typeof show.upcomingSlotsCount === 'number' &&
    typeof show.pastSlotsCount === 'number' &&
    (show.nextSlot === null || isDisplaySlot(show.nextSlot)) &&
    (show.lastSlot === null || isDisplaySlot(show.lastSlot))
  );
}

/** Vérifie qu'une valeur est un TabFilter valide */
export function isTabFilter(value: unknown): value is TabFilter {
  return value === 'upcoming' || value === 'past';
}
