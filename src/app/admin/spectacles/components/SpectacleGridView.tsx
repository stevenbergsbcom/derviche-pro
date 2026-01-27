/**
 * Vue grille des spectacles (desktop mode grille)
 */

'use client';

import { SpectacleCardContent } from './SpectacleCardContent';
import type { SpectacleViewProps } from '../types';

export function SpectacleGridView({
  shows,
  onView,
  onEdit,
  onDelete,
  onCopyLink,
  onNavigateToRepresentations,
  copiedShowId,
  hasFullAccess,
}: SpectacleViewProps) {
  return (
    <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {shows.map((show) => (
        <SpectacleCardContent
          key={show.id}
          show={show}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onCopyLink={onCopyLink}
          onNavigateToRepresentations={onNavigateToRepresentations}
          copiedShowId={copiedShowId}
          hasFullAccess={hasFullAccess}
          variant="grid"
        />
      ))}
    </div>
  );
}
