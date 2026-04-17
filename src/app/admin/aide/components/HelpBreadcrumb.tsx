/**
 * HelpBreadcrumb — Fil d'ariane au-dessus d'un article
 * Derviche Diffusion — S197
 */

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface HelpBreadcrumbProps {
  categoryLabel: string;
  articleTitle: string;
}

export function HelpBreadcrumb({
  categoryLabel,
  articleTitle,
}: HelpBreadcrumbProps) {
  return (
    <nav
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      aria-label="Fil d'Ariane"
    >
      <Link href="/admin/aide" className="hover:text-foreground">
        Aide
      </Link>
      <ChevronRight className="h-3 w-3" aria-hidden="true" />
      <span>{categoryLabel}</span>
      <ChevronRight className="h-3 w-3" aria-hidden="true" />
      <span className="text-foreground font-medium">{articleTitle}</span>
    </nav>
  );
}
