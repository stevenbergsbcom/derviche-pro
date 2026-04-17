/**
 * Configuration des onglets Préférences
 * Derviche Diffusion
 *
 * Source unique de vérité pour la liste des onglets :
 *  - consommée par la page `/admin/preferences` (sélection de la section)
 *  - consommée par le sous-menu sidebar `PreferencesSubmenu`
 *
 * L'URL porte l'onglet actif via `?tab=<id>`.
 */

import {
  BarChart3,
  Building2,
  Calendar,
  Bell,
  CalendarClock,
  FileText,
  Home,
  ListOrdered,
  Mail,
  Palette,
  Scale,
  Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PreferenceStatus = 'active' | 'partial' | 'inactive';

export interface PreferenceTab {
  /** Identifiant stable — passé en `?tab=<id>` dans l'URL. */
  id: string;
  /** Libellé affiché dans la sidebar et en sous-titre de la page. */
  label: string;
  /** Icône Lucide affichée à gauche. */
  icon: LucideIcon;
  /** Statut fonctionnel (inactive = non connecté, etc.). */
  status: PreferenceStatus;
}

export const PREFERENCE_TABS: PreferenceTab[] = [
  { id: 'organization',    label: 'Organisation',    icon: Building2,    status: 'active'   },
  { id: 'homepage',        label: "Page d'accueil",  icon: Home,         status: 'active'   },
  { id: 'classement',      label: 'Classement',      icon: ListOrdered,  status: 'active'   },
  { id: 'appearance',      label: 'Apparence',       icon: Palette,      status: 'active'   },
  { id: 'email',           label: 'Email',           icon: Mail,         status: 'active'   },
  { id: 'templates',       label: 'Templates',       icon: FileText,     status: 'active'   },
  { id: 'notifications',   label: 'Notifications',   icon: Bell,         status: 'active'   },
  { id: 'reminders',       label: 'Rappels',         icon: CalendarClock,status: 'active'   },
  { id: 'google-calendar', label: 'Calendar',        icon: Calendar,     status: 'active'   },
  { id: 'rgpd',            label: 'RGPD',            icon: Shield,       status: 'inactive' },
  { id: 'legal',           label: 'Légal',           icon: Scale,        status: 'active'   },
  { id: 'statistiques',    label: 'Statistiques',    icon: BarChart3,    status: 'active'   },
];

/** Onglet par défaut affiché quand l'URL ne porte aucun `?tab=`. */
export const DEFAULT_TAB = 'organization';
