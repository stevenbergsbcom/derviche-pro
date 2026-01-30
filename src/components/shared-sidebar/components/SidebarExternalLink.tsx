/**
 * Composant lien externe "Voir le site" pour la sidebar
 * @module shared-sidebar/components/SidebarExternalLink
 */

'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { EXTERNAL_LINK_HREF, EXTERNAL_LINK_LABEL } from '../constants';
import type { SidebarExternalLinkProps } from '../types';

/**
 * Lien externe vers le site public
 * S'ouvre dans un nouvel onglet
 */
function SidebarExternalLinkComponent({
  href = EXTERNAL_LINK_HREF,
  label = EXTERNAL_LINK_LABEL,
}: SidebarExternalLinkProps) {
  return (
    <SidebarMenuButton
      asChild
      className="bg-gold/20 text-gold hover:bg-gold/30 hover:text-gold"
      tooltip={label}
    >
      <Link href={href} target="_blank" rel="noopener noreferrer">
        <ExternalLink aria-hidden="true" className="size-4" />
        <span>{label}</span>
      </Link>
    </SidebarMenuButton>
  );
}

SidebarExternalLinkComponent.displayName = 'SidebarExternalLink';

export const SidebarExternalLink = memo(SidebarExternalLinkComponent);
