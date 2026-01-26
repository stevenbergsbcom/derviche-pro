/**
 * Overlay de chargement
 * Derviche Diffusion - PWA Check-in
 */

import { Loader2 } from 'lucide-react';
import type { LoadingOverlayProps } from '../types';

/**
 * Overlay semi-transparent avec spinner
 * Affiché lors du rechargement des données
 */
export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Chargement en cours"
    >
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <Loader2 className="w-8 h-8 animate-spin text-gold" aria-hidden="true" />
      </div>
    </div>
  );
}
