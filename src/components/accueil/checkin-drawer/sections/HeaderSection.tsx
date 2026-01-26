/**
 * HeaderSection - En-tête du drawer de pointage
 * Derviche Diffusion
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Users, ArrowRight } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface HeaderSectionProps {
  /** Nom affiché (prénom + nom) */
  displayName: string;
  /** Nombre de places réservées */
  numPlaces: number;
  /** Callback pour le transfert */
  onTransferClick?: () => void;
  /** La réservation est-elle annulée ? */
  isCancelled: boolean;
  /** En cours de traitement ? */
  isSubmitting: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function HeaderSection({
  displayName,
  numPlaces,
  onTransferClick,
  isCancelled,
  isSubmitting,
}: HeaderSectionProps) {
  return (
    <DrawerHeader className="text-left border-b pb-4">
      <DrawerTitle className="text-2xl">{displayName}</DrawerTitle>
      <DrawerDescription className="sr-only text-base">
        Pointage de la réservation de {displayName}
      </DrawerDescription>
      
      {/* Badge nombre de places + Bouton Transférer */}
      <div className="mt-2 flex items-center justify-between">
        <Badge variant="secondary" className="text-base">
          <Users className="w-4 h-4 mr-1.5" />
          {numPlaces} {numPlaces > 1 ? 'places' : 'place'}
        </Badge>
        
        {/* Bouton Transférer - masqué si annulée */}
        {onTransferClick && !isCancelled && (
          <Button
            variant="outline"
            size="sm"
            onClick={onTransferClick}
            disabled={isSubmitting}
            className="text-sm"
          >
            <ArrowRight className="w-4 h-4 mr-1.5" />
            Transférer
          </Button>
        )}
      </div>
    </DrawerHeader>
  );
}
