/**
 * Section informations générales
 * Derviche Diffusion - Session 110
 */

import { Clock, Calendar, Users } from 'lucide-react';
import type { GeneralInfoSectionProps } from '../types';
import { formatPrice, formatDuration } from '../utils';

export function GeneralInfoSection({
  durationMinutes,
  priceType,
  priceAmount,
  period,
  closureDates,
}: GeneralInfoSectionProps) {
  const formattedDuration = formatDuration(durationMinutes);
  const formattedPrice = formatPrice(priceType, priceAmount);

  return (
    <div className="border rounded-lg p-4 mb-4 bg-muted/10">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4" aria-hidden="true" />
        Informations générales
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        {/* Durée */}
        {formattedDuration && (
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs text-muted-foreground">Durée</p>
              <p className="text-sm text-foreground">{formattedDuration}</p>
            </div>
          </div>
        )}

        {/* Tarif */}
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-muted-foreground mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">Tarif</p>
            <p className="text-sm text-foreground">{formattedPrice}</p>
          </div>
        </div>

        {/* Période */}
        {period && (
          <div>
            <p className="text-xs text-muted-foreground">Période</p>
            <p className="text-sm text-foreground">{period}</p>
          </div>
        )}

        {/* Dates de relâche */}
        {closureDates && (
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Relâche</p>
            <p className="text-sm text-foreground">{closureDates}</p>
          </div>
        )}
      </div>
    </div>
  );
}
