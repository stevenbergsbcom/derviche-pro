/**
 * Skeleton de chargement pour ShowCard
 * Derviche Diffusion - PWA Check-in
 */

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton affiché pendant le chargement des spectacles
 */
export function ShowCardSkeleton() {
  return (
    <Card className="overflow-hidden py-0" aria-hidden="true">
      <CardContent className="p-0">
        <div className="flex gap-3 pr-3">
          <Skeleton className="w-24 h-28 rounded-l-xl shrink-0" />
          <div className="flex-1 space-y-2 py-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
