/**
 * ListSkeleton - Skeleton pour les listes
 * Derviche Diffusion
 */

import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_SKELETON_COUNT } from '../constants';
import type { ListSkeletonProps } from '../types';

/**
 * Affiche des éléments de liste en état de chargement
 */
function ListSkeletonComponent({ count = DEFAULT_SKELETON_COUNT }: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

ListSkeletonComponent.displayName = 'ListSkeleton';

export const ListSkeleton = memo(ListSkeletonComponent);
