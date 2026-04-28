/**
 * Sidebar professionnelle modulaire avec shadcn/ui
 * @module professional-sidebar
 */

'use client';

import { memo, useCallback } from 'react';
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
  useSidebar,
} from '@/components/ui/sidebar';
import {
  SidebarLogo,
  SidebarExternalLink,
  SidebarUserInfo,
  SidebarLogoutButton,
  isRouteActive,
  useSidebarUserData,
  type BaseSidebarUserData,
} from '@/components/shared-sidebar';
import {
  PROFESSIONAL_NAV_ITEMS,
  PROFESSIONAL_BASE_HREF,
  PROFESSIONAL_SUBTITLE,
  PROFESSIONAL_ROLE_LABEL,
} from './constants';

// ============================================
// CONFIG HOOK
// ============================================

const SELECT_QUERY = 'first_name, last_name, email';

function transformData(profile: Record<string, unknown>): BaseSidebarUserData {
  return {
    firstName: profile.first_name as string | null,
    lastName: profile.last_name as string | null,
    email: profile.email as string,
  };
}

// ============================================
// COMPOSANT SIDEBAR
// ============================================

function ProfessionalSidebarComponent() {
  const pathname = usePathname();

  const transformDataCallback = useCallback(
    (profile: Record<string, unknown>) => transformData(profile),
    []
  );

  const { isMobile, setOpenMobile } = useSidebar();

  // Ferme la sidebar sur mobile lors d'un clic sur un lien
  const handleNavClick = useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const { isLoading, displayName } = useSidebarUserData<BaseSidebarUserData>({
    selectQuery: SELECT_QUERY,
    transformData: transformDataCallback,
    contextName: 'professional',
  });

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header avec Logo */}
      <SidebarLogo baseHref={PROFESSIONAL_BASE_HREF} subtitle={PROFESSIONAL_SUBTITLE} />

      <SidebarSeparator />

      {/* Navigation principale */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {PROFESSIONAL_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = isRouteActive(pathname, item.href, PROFESSIONAL_BASE_HREF);

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
                        onClick={handleNavClick}
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
          {/* Lien externe — libellé adapté pour les pros :
              renvoie vers le catalogue public, donc « Tous nos spectacles »
              est plus parlant que le label par défaut « Voir la plateforme ». */}
          <SidebarMenuItem>
            <SidebarExternalLink label="Tous nos spectacles" />
          </SidebarMenuItem>

          {/* Informations utilisateur */}
          <SidebarMenuItem>
            <SidebarUserInfo
              isLoading={isLoading}
              roleLabel={PROFESSIONAL_ROLE_LABEL}
              displayName={displayName}
            />
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

ProfessionalSidebarComponent.displayName = 'ProfessionalSidebar';

export const ProfessionalSidebar = memo(ProfessionalSidebarComponent);
