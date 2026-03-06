/**
 * TransferFooter - Footer avec boutons d'action
 * Derviche Diffusion
 */

'use client';

import { cn } from '@/lib/utils';
import {
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { NotificationSwitches } from '@/components/admin/reservations/notification-switches';
import type { TransferFooterProps } from '../types';

// ============================================
// COMPOSANT
// ============================================

export function TransferFooter({
  selectedSlot,
  numPlaces,
  canTransfer,
  wouldOverbook,
  isSubmitting,
  onTransfer,
  notifOptions,
  onNotifChange,
  hasCalendarEvent,
}: TransferFooterProps) {
  return (
    <DrawerFooter className="border-t pt-4 space-y-3">
      {/* Switch de notification */}
      <NotificationSwitches
        value={notifOptions}
        onChange={onNotifChange}
        disabled={isSubmitting}
        label="Notifier le professionnel"
        hasCalendarEvent={hasCalendarEvent}
      />

      {/* Avertissement overbooking */}
      {wouldOverbook && selectedSlot && (
        <div 
          className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200 mb-3"
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-base">
            <p className="font-medium text-orange-800">Attention : surbooking</p>
            <p className="text-orange-700">
              Ce créneau aura {Math.abs(selectedSlot.remainingCapacity - numPlaces)} place(s) 
              en excès après le transfert.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <DrawerClose asChild>
          <Button 
            variant="outline" 
            className="flex-1 h-12 text-base"
            disabled={isSubmitting}
            aria-label="Annuler le transfert"
          >
            Annuler
          </Button>
        </DrawerClose>
        <Button
          onClick={() => void onTransfer()}
          disabled={!canTransfer}
          aria-label="Transférer la réservation"
          aria-busy={isSubmitting}
          className={cn(
            'flex-1 h-12 text-base',
            wouldOverbook && 'bg-orange-600 hover:bg-orange-700'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              Transfert...
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4 mr-2" aria-hidden="true" />
              Transférer
            </>
          )}
        </Button>
      </div>
    </DrawerFooter>
  );
}
