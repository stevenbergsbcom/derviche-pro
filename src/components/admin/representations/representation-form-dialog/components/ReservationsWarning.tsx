/**
 * Composant ReservationsWarning - Bannière d'avertissement réservations
 * Derviche Diffusion - Session 103
 */

import { AlertTriangle } from 'lucide-react';

import type { ReservationsWarningProps } from '../types';
import { LABELS } from '../constants';

/**
 * Affiche un avertissement quand la représentation a des réservations
 */
export function ReservationsWarning({ show }: ReservationsWarningProps) {
  if (!show) return null;

  return (
    <div
      className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md"
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle
        className="w-5 h-5 text-orange-600 shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div className="text-sm">
        <p className="font-medium text-orange-900">{LABELS.reservationsWarningTitle}</p>
        <p className="text-orange-700 mt-1">{LABELS.reservationsWarningText}</p>
      </div>
    </div>
  );
}
