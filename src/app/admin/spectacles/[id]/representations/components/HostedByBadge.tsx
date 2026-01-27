'use client';

import { Badge } from '@/components/ui/badge';
import { formatHostedByText } from '../helpers';
import type { HostedByBadgeProps } from '../types';

/**
 * Badge affichant qui accueille la représentation (Derviche, Externe ou Compagnie)
 * Mutualisé entre le tableau desktop et les cartes mobile
 */
export function HostedByBadge({ hostedBy, hostedById, internalUsers }: HostedByBadgeProps) {
  const text = formatHostedByText(hostedBy, hostedById, internalUsers);

  if (hostedBy === 'derviche') {
    return (
      <Badge className="bg-derviche/10 text-derviche border-derviche/20">
        {text}
      </Badge>
    );
  }

  if (hostedBy === 'externe') {
    return (
      <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20">
        {text}
      </Badge>
    );
  }

  // hostedBy === 'company'
  return (
    <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">
      {text}
    </Badge>
  );
}
