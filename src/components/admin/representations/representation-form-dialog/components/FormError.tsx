/**
 * Composant FormError - Bannière d'erreur du formulaire
 * Derviche Diffusion - Session 103
 */

import { AlertTriangle } from 'lucide-react';

import type { FormErrorProps } from '../types';

/**
 * Affiche une bannière d'erreur si une erreur est présente
 */
export function FormError({ error }: FormErrorProps) {
  if (!error) return null;

  return (
    <div
      className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md"
      role="alert"
      aria-live="assertive"
    >
      <AlertTriangle
        className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <p className="text-sm text-red-700">{error}</p>
    </div>
  );
}
