/**
 * Composant d'affichage des erreurs de validation
 * Derviche Diffusion - Session 104
 */

'use client';

import { AlertCircle } from 'lucide-react';
import type { ValidationErrorsProps } from '../types';

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div 
      className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-medium">Erreurs de validation</p>
        <ul className="list-disc list-inside mt-1">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
