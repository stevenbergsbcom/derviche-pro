/**
 * Section politique de réservation
 * Derviche Diffusion - Session 110
 */

import { Users } from 'lucide-react';
import { SafeHtml } from '@/components/ui/safe-html';
import type { ReservationPolicySectionProps } from '../types';

export function ReservationPolicySection({
  maxReservationsPerBooking,
  invitationPolicy,
}: ReservationPolicySectionProps) {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-muted/10">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Users className="w-4 h-4" aria-hidden="true" />
        Réservations & Politique
      </h3>
      <div className="space-y-3">
        {/* Max participants */}
        <div>
          <p className="text-xs text-muted-foreground">
            Nombre max de participants par réservation
          </p>
          <p className="text-sm text-foreground font-medium">
            {maxReservationsPerBooking} personne(s)
          </p>
        </div>

        {/* Politique invitation/détaxe */}
        {invitationPolicy && (
          <div>
            <p className="text-xs text-muted-foreground">
              Politique invitation/détaxe
            </p>
            <SafeHtml
              html={invitationPolicy}
              className="text-sm text-foreground"
            />
          </div>
        )}
      </div>
    </div>
  );
}
