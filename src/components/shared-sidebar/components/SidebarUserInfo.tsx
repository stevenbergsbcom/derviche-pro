/**
 * Composant affichage des informations utilisateur dans la sidebar
 * @module shared-sidebar/components/SidebarUserInfo
 */

'use client';

import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { CONNECTED_AS_PREFIX, LOADING_TEXT } from '../constants';
import type { SidebarUserInfoProps } from '../types';

/**
 * Affiche les informations de l'utilisateur connecté
 * Se cache automatiquement en mode collapsed (icônes uniquement)
 */
function SidebarUserInfoComponent({
  isLoading,
  roleLabel,
  displayName,
}: SidebarUserInfoProps) {
  return (
    <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
      <p className="text-xs text-sidebar-foreground/50">{CONNECTED_AS_PREFIX}</p>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sidebar-foreground/70">
          <Loader2
            aria-hidden="true"
            className="size-3 animate-spin"
          />
          <span className="text-sm">{LOADING_TEXT}</span>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-gold">{roleLabel}</p>
          <p className="truncate text-sm text-sidebar-foreground">
            {displayName}
          </p>
        </>
      )}
    </div>
  );
}

SidebarUserInfoComponent.displayName = 'SidebarUserInfo';

export const SidebarUserInfo = memo(SidebarUserInfoComponent);
