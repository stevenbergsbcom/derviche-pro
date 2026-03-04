/**
 * CancelledBanner - Bandeau pour réservation annulée
 * Derviche Diffusion
 */

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Loader2, Check } from 'lucide-react';
import {
  NotificationSwitches,
  type NotificationOptions,
} from '@/components/admin/reservations/notification-switches';

// ============================================
// TYPES
// ============================================

export interface CancelledBannerProps {
  /** La réservation est-elle annulée ? */
  isCancelled: boolean;
  /** Vient-elle d'être réactivée ? */
  justReactivated: boolean;
  /** En cours de traitement ? */
  isSubmitting: boolean;
  /** Handler de réactivation */
  onReactivate: () => void;
  /** Options de notification pour la réactivation */
  reactivateNotifOptions: NotificationOptions;
  onReactivateNotifChange: (options: NotificationOptions) => void;
  // Note : pas de hasCalendarEvent pour la réactivation (= création d'événement) — switch toujours visible
}

// ============================================
// COMPOSANT
// ============================================

export function CancelledBanner({
  isCancelled,
  justReactivated,
  isSubmitting,
  onReactivate,
  reactivateNotifOptions,
  onReactivateNotifChange,
}: CancelledBannerProps) {
  // Si pas annulée et pas juste réactivée, ne rien afficher
  if (!isCancelled && !justReactivated) {
    return null;
  }

  return (
    <>
      {/* Bandeau réservation annulée + switch notif réactivation */}
      {isCancelled && (
        <div className="space-y-2">
          <Alert variant="destructive" className="border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Cette réservation est annulée</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void onReactivate()}
                disabled={isSubmitting}
                className="ml-3 border-red-300 hover:bg-red-100 text-red-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                )}
                Réactiver
              </Button>
            </AlertDescription>
          </Alert>
          {/* hasCalendarEvent non passé : réactivation = création d'événement, switch toujours visible */}
          <NotificationSwitches
            value={reactivateNotifOptions}
            onChange={onReactivateNotifChange}
            disabled={isSubmitting}
            label="Notifications si réactivation"
          />
        </div>
      )}

      {/* Message après réactivation */}
      {justReactivated && (
        <Alert className="border-green-300 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Réservation réactivée ! Vous pouvez maintenant pointer cette personne.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
