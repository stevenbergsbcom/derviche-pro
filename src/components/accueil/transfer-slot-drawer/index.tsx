/**
 * TransferSlotDrawer - Drawer de transfert de réservation
 * Derviche Diffusion
 * 
 * Permet de transférer une réservation vers un autre créneau
 * du même spectacle, avec possibilité de modifier le nombre de places
 * 
 * Refactorisé Session 83 : pattern hook + sections
 * S142 : visualViewport pour le clavier mobile
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';

import { useTransferSlot } from './useTransferSlot';
import {
  DrawerHeader,
  PlacesSelector,
  SlotsList,
  TransferFooter,
} from './components';

import type { TransferSlotDrawerProps } from './types';

// ============================================
// RÉ-EXPORT DES TYPES
// ============================================

export type { TransferSlotDrawerProps } from './types';

// ============================================
// COMPOSANT
// ============================================

export function TransferSlotDrawer({
  reservation,
  currentSlotId,
  open,
  onOpenChange,
  onSuccess,
}: TransferSlotDrawerProps) {
  // Hook personnalisé pour toute la logique
  const transfer = useTransferSlot({
    reservation,
    currentSlotId,
    open,
    onSuccess,
    onOpenChange,
  });

  // ==========================================
  // VISUAL VIEWPORT — Gestion clavier mobile
  // ==========================================
  const [vpHeight, setVpHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => setVpHeight(vv.height);
    update();

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  const drawerStyle = vpHeight
    ? { minHeight: `${vpHeight * 0.9}px`, maxHeight: `${vpHeight}px` }
    : undefined;

  // Si pas de réservation, ne rien afficher
  if (!reservation) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="max-h-[90dvh]"
        style={drawerStyle}
      >
        {/* En-tête */}
        <DrawerHeader
          displayName={transfer.displayName}
          numPlaces={reservation.numPlaces}
        />

        {/* Corps du drawer */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Nombre de places */}
          <PlacesSelector
            numPlaces={transfer.numPlaces}
            originalNumPlaces={reservation.numPlaces}
            isSubmitting={transfer.isSubmitting}
            onDecrease={transfer.handleDecrease}
            onIncrease={transfer.handleIncrease}
            onChange={transfer.handleNumPlacesChange}
          />

          {/* Liste des créneaux */}
          <SlotsList
            slots={transfer.slots}
            selectedSlotId={transfer.selectedSlotId}
            numPlaces={transfer.numPlaces}
            isLoading={transfer.isLoadingSlots}
            isSubmitting={transfer.isSubmitting}
            error={transfer.error}
            onSelectSlot={transfer.setSelectedSlotId}
          />
        </div>

        {/* Footer avec boutons d'action */}
        <TransferFooter
          selectedSlot={transfer.selectedSlot}
          numPlaces={transfer.numPlaces}
          canTransfer={transfer.canTransfer}
          wouldOverbook={transfer.wouldOverbook}
          isSubmitting={transfer.isSubmitting}
          onTransfer={transfer.handleTransfer}
          notifOptions={transfer.notifOptions}
          onNotifChange={transfer.setNotifOptions}
          hasCalendarEvent={transfer.hasCalendarEvent}
        />
      </DrawerContent>
    </Drawer>
  );
}
