/**
 * Sidebar admin modulaire avec shadcn/ui
 * @module admin-sidebar
 */

'use client';

import { Fragment, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  SidebarLogo,
  SidebarExternalLink,
  SidebarUserInfo,
  SidebarAccountLink,
  SidebarLogoutButton,
  isRouteActive,
} from '@/components/shared-sidebar';
import { useAdminSidebarData } from './hooks/useAdminSidebarData';
import { PreferencesSubmenu } from './preferences-submenu';
import {
  ADMIN_BASE_HREF,
  ADMIN_ACCOUNT_HREF,
  ADMIN_SUBTITLE,
  DEFAULT_ROLE_LABEL,
} from './constants';

/**
 * Sidebar admin avec gestion des rôles et navigation conditionnelle
 */
function AdminSidebarComponent() {
  const pathname = usePathname();
  const { userData, isLoading, displayName, filteredNavItems } =
    useAdminSidebarData();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header avec Logo */}
      <SidebarLogo baseHref={ADMIN_BASE_HREF} subtitle={ADMIN_SUBTITLE} />

      {/* Navigation principale */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isRouteActive(pathname, item.href, ADMIN_BASE_HREF);

                // Le sous-menu Préférences (11 sous-items) s'intercale juste
                // avant l'item « Système » — ordre défini dans constants.ts.
                const renderPrefsBefore = item.href === '/admin/systeme';

                return (
                  <Fragment key={item.href}>
                    {renderPrefsBefore && <PreferencesSubmenu role={userData?.role ?? null} />}
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.tooltip || item.label}
                      >
                        <Link
                          href={item.href}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon aria-hidden="true" className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </Fragment>
                );
              })}
              {/* Cas où « Système » n'est pas visible (rôle non super-admin) :
                  PreferencesSubmenu reste masqué côté rôle, donc pas besoin
                  d'une branche supplémentaire ici. */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer avec utilisateur */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {/* Lien "Voir le site" */}
          <SidebarMenuItem>
            <SidebarExternalLink />
          </SidebarMenuItem>

          {/* Informations utilisateur */}
          <SidebarMenuItem>
            <SidebarUserInfo
              isLoading={isLoading}
              roleLabel={userData?.roleLabel || DEFAULT_ROLE_LABEL}
              displayName={displayName}
            />
          </SidebarMenuItem>

          {/* Lien "Mon compte" */}
          <SidebarMenuItem>
            <SidebarAccountLink href={ADMIN_ACCOUNT_HREF} />
          </SidebarMenuItem>

          {/* Bouton déconnexion */}
          <SidebarMenuItem>
            <SidebarLogoutButton />
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarFooter>

      {/* Rail pour hover-expand en mode collapsed */}
      <SidebarRail />
    </Sidebar>
  );
}

AdminSidebarComponent.displayName = 'AdminSidebar';

export const AdminSidebar = memo(AdminSidebarComponent);

// Ré-export des types pour usage externe
export type { AdminNavItem, AdminSidebarUserData } from './types';
