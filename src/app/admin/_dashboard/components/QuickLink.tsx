/**
 * QuickLink - Lien d'accès rapide
 * Derviche Diffusion
 */

import { memo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import type { QuickLinkItem } from '../types';

/**
 * Props pour QuickLink (sous-ensemble de QuickLinkItem)
 */
type QuickLinkProps = Pick<QuickLinkItem, 'href' | 'icon' | 'title' | 'description'>;

/**
 * Carte cliquable pour la navigation rapide
 */
function QuickLinkComponent({ href, icon: Icon, title, description }: QuickLinkProps) {
  return (
    <Link href={href}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{title}</p>
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          </div>
          <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

QuickLinkComponent.displayName = 'QuickLink';

export const QuickLink = memo(QuickLinkComponent);
