/**
 * Sidebar admin modulaire avec shadcn/ui
 * @module admin-sidebar
 */

'use client';

import { memo, useState, useCallback } from 'react';
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
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationBadge } from '@/components/admin/notifications/notification-badge';
import { NotificationSheet } from '@/components/admin/notifications/notification-sheet';
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

  // Notifications
  const notificationsHook = useNotifications();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleBadgeClick = useCallback(() => {
    setSheetOpen(true);
    void notificationsHook.loadNotifications(1);
  }, [notificationsHook]);

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

                return (
                  <SidebarMenuItem key={item.href}>
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
                );
              })}
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

          {/* Badge notifications */}
          <SidebarMenuItem>
            <NotificationBadge
              unreadCount={notificationsHook.unreadCount}
              isLoading={notificationsHook.isBadgeLoading}
              onClick={handleBadgeClick}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Rail pour hover-expand en mode collapsed */}
      <SidebarRail />

      {/* Sheet notifications */}
      <NotificationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        hook={notificationsHook}
      />
    </Sidebar>
  );
}

AdminSidebarComponent.displayName = 'AdminSidebar';

export const AdminSidebar = memo(AdminSidebarComponent);

// Ré-export des types pour usage externe
export type { AdminNavItem, AdminSidebarUserData } from './types';
