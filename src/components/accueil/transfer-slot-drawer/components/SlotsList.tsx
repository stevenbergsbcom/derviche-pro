/**
 * SlotsList - Liste des créneaux disponibles
 * Derviche Diffusion
 */

'use client';

import { Separator } from '@/components/ui/separator';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { SlotsListProps } from '../types';
import { SlotItem } from './SlotItem';

// ============================================
// COMPOSANT
// ============================================

export function SlotsList({
  slots,
  selectedSlotId,
  numPlaces,
  isLoading,
  isSubmitting,
  error,
  onSelectSlot,
}: SlotsListProps) {
  return (
    <>
      <Separator />

      {/* Label de la liste */}
      <div className="p-4 pb-2">
        <p className="text-base font-medium text-muted-foreground mb-3">
          Sélectionner le nouveau créneau
        </p>
      </div>

      {/* Zone scrollable pour les slots */}
      <div 
        className="flex-1 overflow-y-auto px-4"
        role="listbox"
        aria-label="Liste des créneaux disponibles"
      >
        {isLoading ? (
          <div 
            className="flex items-center justify-center py-12"
            role="status"
            aria-label="Chargement des créneaux"
          >
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div 
            className="flex flex-col items-center justify-center py-12 text-center"
            role="alert"
            aria-live="polite"
          >
            <AlertTriangle className="w-8 h-8 text-muted-foreground mb-2" aria-hidden="true" />
            <p className="text-base text-muted-foreground">{error}</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4" role="listbox" aria-label="Créneaux disponibles">
            {slots.map((slot) => (
              <SlotItem
                key={slot.id}
                slot={slot}
                isSelected={selectedSlotId === slot.id}
                onSelect={() => onSelectSlot(slot.id)}
                numPlaces={numPlaces}
                disabled={isSubmitting}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
