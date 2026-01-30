/**
 * Sidebar company modulaire avec shadcn/ui
 * @module company-sidebar
 */

'use client';

import { memo } from 'react';
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  SidebarLogo,
  SidebarExternalLink,
  SidebarUserInfo,
  SidebarAccountLink,
  SidebarLogoutButton,
  isRouteActive,
} from '@/components/shared-sidebar';
import { useCompanySidebarData } from './hooks/useCompanySidebarData';
import { CompanyBadge } from './components/CompanyBadge';
import {
  COMPANY_NAV_ITEMS,
  COMPANY_BASE_HREF,
  COMPANY_ACCOUNT_HREF,
  COMPANY_SUBTITLE,
  COMPANY_ROLE_LABEL,
} from './constants';

/**
 * Sidebar company avec affichage du nom de la compagnie
 */
function CompanySidebarComponent() {
  const pathname = usePathname();
  const { userData, isLoading, displayName } = useCompanySidebarData();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header avec Logo */}
      <SidebarLogo baseHref={COMPANY_BASE_HREF} subtitle={COMPANY_SUBTITLE} />

      {/* Badge nom de la compagnie */}
      <CompanyBadge companyName={userData?.companyName || null} />

      <SidebarSeparator />

      {/* Navigation principale */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {COMPANY_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = isRouteActive(pathname, item.href, COMPANY_BASE_HREF);

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
              roleLabel={COMPANY_ROLE_LABEL}
              displayName={displayName}
            />
          </SidebarMenuItem>

          {/* Lien "Mon compte" */}
          <SidebarMenuItem>
            <SidebarAccountLink href={COMPANY_ACCOUNT_HREF} />
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

CompanySidebarComponent.displayName = 'CompanySidebar';

export const CompanySidebar = memo(CompanySidebarComponent);

// Ré-export des types pour usage externe
export type { CompanySidebarUserData } from './types';
