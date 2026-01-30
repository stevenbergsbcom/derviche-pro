/**
 * Composant bouton de déconnexion pour la sidebar
 * @module shared-sidebar/components/SidebarLogoutButton
 */

'use client';

import { memo } from 'react';
import { LogOut } from 'lucide-react';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { LogoutButton } from '@/components/auth/logout-button';
import { LOGOUT_LABEL } from '../constants';

/**
 * Bouton de déconnexion stylisé pour la sidebar
 * Utilise SidebarMenuButton pour gérer le mode collapsed avec tooltip
 */
function SidebarLogoutButtonComponent() {
  return (
    <SidebarMenuButton asChild tooltip={LOGOUT_LABEL}>
      <LogoutButton
        variant="ghost"
        className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut aria-hidden="true" className="size-4" />
        <span>{LOGOUT_LABEL}</span>
      </LogoutButton>
    </SidebarMenuButton>
  );
}

SidebarLogoutButtonComponent.displayName = 'SidebarLogoutButton';

export const SidebarLogoutButton = memo(SidebarLogoutButtonComponent);
