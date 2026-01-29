/**
 * Banner d'avertissement pour réservation annulée
 * Derviche Diffusion - Session 111
 */

'use client';

import { Ban } from 'lucide-react';
import { formatDateTimeFr } from '../utils';
import { ALERT_MESSAGES } from '../constants';
import type { CancelledBannerProps } from '../types';

export function CancelledBanner({ cancelledAt, cancellationReason }: CancelledBannerProps) {
  const { title, prefix, reasonPrefix } = ALERT_MESSAGES.cancelled;
  
  return (
    <div 
      className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800"
      role="alert"
      aria-live="polite"
    >
      <Ban className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-medium">{title}</p>
        {cancelledAt && (
          <p className="text-red-600">
            {prefix} {formatDateTimeFr(cancelledAt)}
          </p>
        )}
        {cancellationReason && (
          <p className="mt-1 text-red-600/80">
            {reasonPrefix} {cancellationReason}
          </p>
        )}
      </div>
    </div>
  );
}
