/**
 * DrawerHeader - En-tête du drawer avec indicateur de capacité
 * Derviche Diffusion - Session 82
 */

'use client';

import { Users } from 'lucide-react';
import {
  DrawerHeader as UIDrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
export function DrawerHeader() {
  return (
    <UIDrawerHeader className="text-left border-b py-3">
      <DrawerTitle className="text-2xl flex items-center gap-2">
        <Users className="w-4 h-4" aria-hidden="true" />
        Nouvelle réservation
      </DrawerTitle>
    </UIDrawerHeader>
  );
}
