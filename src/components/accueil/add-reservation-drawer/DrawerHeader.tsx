/**
 * DrawerHeader - En-tête du drawer avec indicateur de capacité
 * Derviche Diffusion - Session 82
 */

'use client';

import { Users } from 'lucide-react';
import {
  DrawerHeader as UIDrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import type { DrawerHeaderProps } from './types';

export function DrawerHeader({ capacityInfo }: DrawerHeaderProps) {
  return (
    <UIDrawerHeader className="text-left border-b pb-4">
      <DrawerTitle className="text-2xl flex items-center gap-2">
        <Users className="w-5 h-5" aria-hidden="true" />
        Nouvelle réservation
      </DrawerTitle>
      <DrawerDescription className="text-base">
        Créer une réservation pour ce créneau
      </DrawerDescription>

      {/* Indicateur de capacité */}
      {capacityInfo && (
        <div className="mt-2">
          {capacityInfo.isUnlimited ? (
            <Badge variant="secondary">Capacité illimitée</Badge>
          ) : (
            <Badge
              variant={capacityInfo.remaining > 5 ? 'secondary' : 'destructive'}
            >
              {capacityInfo.remaining} place
              {capacityInfo.remaining > 1 ? 's' : ''} restante
              {capacityInfo.remaining > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}
    </UIDrawerHeader>
  );
}
