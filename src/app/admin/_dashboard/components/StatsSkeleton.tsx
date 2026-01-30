/**
 * StatsSkeleton - Skeleton pour les cartes de statistiques
 * Derviche Diffusion
 */

import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Props pour StatsSkeleton
 */
interface StatsSkeletonProps {
  /** Nombre de cartes à afficher (défaut: 4) */
  count?: number;
}

/**
 * Affiche des cartes de statistiques en état de chargement
 */
function StatsSkeletonComponent({ count = 4 }: StatsSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

StatsSkeletonComponent.displayName = 'StatsSkeleton';

export const StatsSkeleton = memo(StatsSkeletonComponent);
