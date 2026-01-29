/**
 * Banner d'avertissement pour anomalie de données
 * Derviche Diffusion - Session 111
 */

'use client';

import { AlertTriangle } from 'lucide-react';
import { ALERT_MESSAGES } from '../constants';
import type { AnomalyBannerProps } from '../types';

export function AnomalyBanner({ hasAnomaly }: AnomalyBannerProps) {
  if (!hasAnomaly) return null;
  
  const { title, description } = ALERT_MESSAGES.anomaly;
  
  return (
    <div 
      className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800"
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-medium">{title}</p>
        <p>{description}</p>
      </div>
    </div>
  );
}
