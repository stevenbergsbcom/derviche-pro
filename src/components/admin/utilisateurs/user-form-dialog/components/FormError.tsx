/**
 * Composant FormError - Bannière d'erreur serveur
 * Derviche Diffusion - Session 102
 */

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { FormErrorProps } from '../types';

/**
 * Bannière d'affichage des erreurs serveur
 */
export function FormError({ error }: FormErrorProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
