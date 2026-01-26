/**
 * DrawerHeader - En-tête du drawer de transfert
 * Derviche Diffusion
 */

'use client';

import {
  DrawerHeader as UIDrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { ArrowRight } from 'lucide-react';
import type { DrawerHeaderProps } from '../types';

// ============================================
// COMPOSANT
// ============================================

export function DrawerHeader({ displayName, numPlaces }: DrawerHeaderProps) {
  return (
    <UIDrawerHeader className="text-left border-b pb-4">
      <DrawerTitle className="text-2xl flex items-center gap-2">
        <ArrowRight className="w-5 h-5 text-primary" aria-hidden="true" />
        Transférer la réservation
      </DrawerTitle>
      <DrawerDescription className="text-base">
        {displayName} • {numPlaces} {numPlaces > 1 ? 'places' : 'place'}
      </DrawerDescription>
    </UIDrawerHeader>
  );
}
