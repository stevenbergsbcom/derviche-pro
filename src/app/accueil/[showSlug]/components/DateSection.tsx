/**
 * DateSection - Section de slots groupés par date
 * Derviche Diffusion
 */

import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatSlotDate, isSlotToday } from '@/lib/services/checkin';
import { SlotCard } from '@/components/accueil';
import type { DateSectionProps } from '../types';

export function DateSection({
  date,
  slots,
  onSlotClick,
  isPast = false,
}: DateSectionProps) {
  const isToday = isSlotToday(date);
  const dateLabel = isToday ? "Aujourd'hui" : formatSlotDate(date);

  return (
    <section aria-labelledby={`date-heading-${date}`}>
      <h3
        id={`date-heading-${date}`}
        className={cn(
          'text-base font-semibold uppercase tracking-wide mb-3 flex items-center gap-2',
          isToday ? 'text-gold' : isPast ? 'text-muted-foreground/70' : 'text-muted-foreground'
        )}
      >
        <Calendar className="w-4 h-4" aria-hidden="true" />
        {dateLabel}
      </h3>
      <div className="space-y-4">
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            onClick={() => onSlotClick(slot.id)}
          />
        ))}
      </div>
    </section>
  );
}
