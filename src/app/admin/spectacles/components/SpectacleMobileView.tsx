/**
 * Vue mobile des spectacles (cartes empilées)
 */

'use client';

import { SpectacleCardContent } from './SpectacleCardContent';
import type { SpectacleViewProps } from '../types';

export function SpectacleMobileView({
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
    <div className="lg:hidden space-y-4">
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
          variant="mobile"
        />
      ))}
    </div>
  );
}
