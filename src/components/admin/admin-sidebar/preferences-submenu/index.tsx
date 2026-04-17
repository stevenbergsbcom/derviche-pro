/**
 * PreferencesSubmenu — orchestrateur
 * Derviche Diffusion
 *
 * Responsabilités :
 *  - restreindre l'affichage aux super-admins (même règle que l'ancien
 *    `allowedRoles: ['super-admin']` sur l'item retiré de `ADMIN_NAV_ITEMS`)
 *  - aiguiller entre rendu `Expanded` et `Collapsed` selon l'état de la sidebar
 */

'use client';

import { useSidebar } from '@/components/ui/sidebar';
import type { InternalRole } from '@/types/database';
import { PreferencesSubmenuExpanded } from './Expanded';
import { PreferencesSubmenuCollapsed } from './Collapsed';

interface PreferencesSubmenuProps {
  /** Rôle courant — null pendant le chargement. */
  role: InternalRole | null;
}

export function PreferencesSubmenu({ role }: PreferencesSubmenuProps) {
  const { state, isMobile } = useSidebar();

  // Réservé aux super-admins
  if (role !== 'super-admin') return null;

  // En mobile la sidebar s'ouvre en Sheet plein écran → on rend l'Expanded
  const isIconOnly = !isMobile && state === 'collapsed';

  return isIconOnly ? <PreferencesSubmenuCollapsed /> : <PreferencesSubmenuExpanded />;
}
