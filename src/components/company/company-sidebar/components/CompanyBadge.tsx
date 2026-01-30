/**
 * Badge affichant le nom de la compagnie dans la sidebar
 * @module company-sidebar/components/CompanyBadge
 */

'use client';

import { memo } from 'react';
import { Building2 } from 'lucide-react';

interface CompanyBadgeProps {
  /** Nom de la compagnie à afficher */
  companyName: string | null;
}

/**
 * Badge affichant le nom de la compagnie
 * Se cache automatiquement en mode collapsed (icônes uniquement)
 */
function CompanyBadgeComponent({ companyName }: CompanyBadgeProps) {
  if (!companyName) return null;

  return (
    <div className="mx-2 flex items-center gap-2 rounded-md bg-sidebar-accent/50 px-3 py-2 text-gold group-data-[collapsible=icon]:hidden">
      <Building2 aria-hidden="true" className="size-4 shrink-0" />
      <span className="truncate text-sm font-medium">{companyName}</span>
    </div>
  );
}

CompanyBadgeComponent.displayName = 'CompanyBadge';

export const CompanyBadge = memo(CompanyBadgeComponent);
