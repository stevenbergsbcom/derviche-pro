/**
 * FormFooter - Boutons d'action du formulaire
 * Derviche Diffusion - Session 82
 *
 * Boutons Annuler et Créer la réservation
 */

'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import type { FormFooterProps } from '../types';

export function FormFooter({ isSubmitting }: FormFooterProps) {
  return (
    <DrawerFooter className="border-t pt-4">
      <div className="flex gap-3">
        <DrawerClose asChild>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        </DrawerClose>
        <Button
          type="submit"
          className="flex-1 bg-gold hover:bg-gold/90 text-derviche-dark"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              Création...
            </>
          ) : (
            'Créer la réservation'
          )}
        </Button>
      </div>
    </DrawerFooter>
  );
}
