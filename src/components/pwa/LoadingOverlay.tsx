/**
 * LoadingOverlay - Overlay de chargement en plein écran
 * Derviche Diffusion - PWA
 * 
 * Usage :
 * <LoadingOverlay visible={isLoading} />
 * // ou sans prop (toujours visible)
 * {isLoading && <LoadingOverlay />}
 */

'use client';

import { Loader2 } from 'lucide-react';
import type { LoadingOverlayProps } from './types';

/**
 * Overlay semi-transparent avec spinner
 * Affiché lors du rechargement des données
 * 
 * @param visible - Contrôle la visibilité (défaut: true)
 * @param ariaLabel - Label personnalisé pour accessibilité
 */
export function LoadingOverlay({ 
  visible = true, 
  ariaLabel = 'Chargement en cours' 
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <Loader2 className="w-8 h-8 animate-spin text-gold" aria-hidden="true" />
      </div>
    </div>
  );
}
