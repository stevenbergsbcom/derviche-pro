/**
 * Bannière d'erreur du formulaire
 * Derviche Diffusion - Session 101
 */

'use client';

import { Button } from '@/components/ui/button';
import type { FormErrorProps } from '../types';

export function FormError({ error, onClose }: FormErrorProps) {
  if (!error) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mx-1 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3"
    >
      <div className="text-sm text-destructive flex-1">{error}</div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-6 px-2 text-xs"
      >
        Fermer
      </Button>
    </div>
  );
}
