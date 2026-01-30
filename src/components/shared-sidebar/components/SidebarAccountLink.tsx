/**
 * Composant lien "Mon compte" pour la sidebar
 * @module shared-sidebar/components/SidebarAccountLink
 */

'use client';

import { memo } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { ACCOUNT_LINK_LABEL } from '../constants';
import type { SidebarAccountLinkProps } from '../types';

/**
 * Lien vers la page "Mon compte"
 */
function SidebarAccountLinkComponent({ href }: SidebarAccountLinkProps) {
  return (
    <SidebarMenuButton asChild tooltip={ACCOUNT_LINK_LABEL}>
      <Link href={href}>
        <User aria-hidden="true" className="size-4" />
        <span>{ACCOUNT_LINK_LABEL}</span>
      </Link>
    </SidebarMenuButton>
  );
}

SidebarAccountLinkComponent.displayName = 'SidebarAccountLink';

export const SidebarAccountLink = memo(SidebarAccountLinkComponent);
