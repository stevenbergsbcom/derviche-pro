/**
 * Composant Logo pour la sidebar
 * @module shared-sidebar/components/SidebarLogo
 */

'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SidebarHeader, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { LOGO_PATH, LOGO_DIMENSIONS, LOGO_ALT } from '../constants';
import type { SidebarLogoProps } from '../types';

/**
 * Logo Derviche Diffusion pour la sidebar
 * S'adapte au mode collapsed (affiche une version réduite centrée)
 */
function SidebarLogoComponent({ baseHref, subtitle }: SidebarLogoProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarHeader className="border-b border-sidebar-border p-2">
      <SidebarMenuButton
        asChild
        size="lg"
        className="w-full hover:bg-transparent"
        tooltip={subtitle}
      >
        <Link
          href={baseHref}
          className={`flex items-center justify-center ${isCollapsed ? 'p-0' : 'flex-col gap-2 py-2'}`}
        >
          {isCollapsed ? (
            // Version réduite centrée en mode collapsed
            <div className="flex size-8 items-center justify-center">
              <Image
                src={LOGO_PATH}
                alt={LOGO_ALT}
                width={32}
                height={32}
                className="size-8 object-contain"
                priority
              />
            </div>
          ) : (
            // Version complète en mode expanded
            <>
              <Image
                src={LOGO_PATH}
                alt={LOGO_ALT}
                width={LOGO_DIMENSIONS.width}
                height={LOGO_DIMENSIONS.height}
                className="h-16 w-auto"
                priority
              />
              <span className="text-sm font-medium text-sidebar-foreground/80">
                {subtitle}
              </span>
            </>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarHeader>
  );
}

SidebarLogoComponent.displayName = 'SidebarLogo';

export const SidebarLogo = memo(SidebarLogoComponent);
