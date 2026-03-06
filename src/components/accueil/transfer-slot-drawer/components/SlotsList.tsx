/**
 * SlotsList - Liste des créneaux disponibles
 * Derviche Diffusion
 * 
 * Slots à venir affichés en premier.
 * Slots passés masqués par défaut, révélés via un bouton.
 */

'use client';

import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SlotsListProps } from '../types';
import { SlotItem } from './SlotItem';
import { isSlotPast } from '../helpers';

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
  const [showPast, setShowPast] = useState(false);

  // Séparer les slots à venir des passés
  const upcomingSlots = slots.filter((s) => !isSlotPast(s.date, s.time));
  const pastSlots = slots.filter((s) => isSlotPast(s.date, s.time));

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
          <div className="space-y-3 pb-4">

            {/* Slots à venir */}
            {upcomingSlots.length === 0 && pastSlots.length === 0 && (
              <p className="text-base text-muted-foreground text-center py-8">
                Aucun autre créneau disponible.
              </p>
            )}

            {upcomingSlots.length === 0 && pastSlots.length > 0 && (
              <p className="text-base text-muted-foreground text-center py-4">
                Aucun créneau à venir pour ce spectacle.
              </p>
            )}

            <div role="listbox" aria-label="Créneaux à venir">
              {upcomingSlots.map((slot) => (
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

            {/* Bouton pour afficher les slots passés */}
            {pastSlots.length > 0 && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPast((v) => !v)}
                  aria-expanded={showPast}
                  className="w-full text-muted-foreground gap-2 h-10 text-base"
                >
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      showPast && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                  {showPast
                    ? 'Masquer les représentations passées'
                    : `Voir les représentations passées (${pastSlots.length})`}
                </Button>

                {/* Slots passés */}
                {showPast && (
                  <div
                    className="mt-3 space-y-3"
                    role="listbox"
                    aria-label="Représentations passées"
                  >
                    {pastSlots.map((slot) => (
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
            )}

          </div>
        )}
      </div>
    </>
  );
}
