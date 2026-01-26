/**
 * LoadingOverlay - Overlay de chargement en plein écran
 * Derviche Diffusion
 */

'use client';

import { Loader2 } from 'lucide-react';

export function LoadingOverlay() {
  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      role="status"
      aria-label="Chargement en cours"
      aria-busy="true"
    >
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <Loader2 className="w-8 h-8 animate-spin text-gold" aria-hidden="true" />
      </div>
    </div>
  );
}
