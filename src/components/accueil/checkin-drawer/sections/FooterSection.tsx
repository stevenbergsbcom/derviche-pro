/**
 * FooterSection - Boutons d'action du drawer
 * Derviche Diffusion
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Loader2, X } from 'lucide-react';
import type { CheckinStatus } from '@/types/database';
import {
  NotificationSwitches,
  type NotificationOptions,
} from '@/components/admin/reservations/notification-switches';

// ============================================
// TYPES
// ============================================

export interface FooterSectionProps {
  /** Statut actuellement sélectionné */
  selectedStatus: CheckinStatus | null;
  /** Y a-t-il des modifications non sauvegardées ? */
  hasChanges: boolean;
  /** Peut-on sauvegarder ? */
  canSave: boolean;
  /** La réservation est-elle annulée ? */
  isCancelled: boolean;
  /** En cours de traitement ? */
  isSubmitting: boolean;
  /** Handler de sauvegarde */
  onSave: () => void;
  /** Handler d'annulation */
  onCancel: () => void;
  /** Options de notification pour l'annulation */
  cancelNotifOptions: NotificationOptions;
  onCancelNotifChange: (options: NotificationOptions) => void;
  /** Un événement Google Calendar existe-t-il pour cette réservation ? */
  hasCalendarEvent?: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function FooterSection({
  selectedStatus,
  hasChanges,
  canSave,
  isCancelled,
  isSubmitting,
  onSave,
  onCancel,
  cancelNotifOptions,
  onCancelNotifChange,
  hasCalendarEvent,
}: FooterSectionProps) {
  return (
    <DrawerFooter className="border-t pt-4">
      <div className="flex gap-3">
        <DrawerClose asChild>
          <Button 
            variant="outline" 
            className="flex-1"
            disabled={isSubmitting}
          >
            Fermer
          </Button>
        </DrawerClose>
        <Button
          onClick={() => void onSave()}
          disabled={!canSave}
          className={cn(
            'flex-1',
            selectedStatus === 'absent' && 'bg-red-600 hover:bg-red-700'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer'
          )}
        </Button>
      </div>
      
      {/* Indicateur de changement */}
      {hasChanges && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          Modifications non enregistrées
        </p>
      )}

      {/* Switch notif + bouton annuler - uniquement si confirmée */}
      {!isCancelled && (
        <div className="mt-2 space-y-2">
          <NotificationSwitches
            value={cancelNotifOptions}
            onChange={onCancelNotifChange}
            disabled={isSubmitting}
            label="Notifications si annulation"
            hasCalendarEvent={hasCalendarEvent}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void onCancel()}
            disabled={isSubmitting}
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1.5" />
            Annuler cette réservation
          </Button>
        </div>
      )}
    </DrawerFooter>
  );
}
