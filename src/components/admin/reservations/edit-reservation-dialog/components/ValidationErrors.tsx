/**
 * Affichage des erreurs de validation
 * Derviche Diffusion - Session 111
 */

'use client';

import { AlertCircle } from 'lucide-react';
import { ALERT_MESSAGES } from '../constants';
import type { ValidationErrorsProps } from '../types';

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (errors.length === 0) return null;
  
  return (
    <div 
      className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-medium">{ALERT_MESSAGES.validation.title}</p>
        <ul className="list-disc list-inside mt-1">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
