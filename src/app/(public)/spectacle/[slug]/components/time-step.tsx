/**
 * TimeStep — Selection du creneau horaire
 * Derviche Diffusion - Page spectacle
 */

import { Button } from '@/components/ui/button';
import type { TimeSlot } from '../types';

// ============================================
// PROPS
// ============================================

interface TimeStepProps {
  selectedDate: Date | null;
  slotsForSelectedDate: TimeSlot[];
  isAdminRole: boolean;
  onSlotSelect: (slot: TimeSlot) => void;
}

// ============================================
// COMPONENT
// ============================================

export function TimeStep({
  selectedDate,
  slotsForSelectedDate,
  isAdminRole,
  onSlotSelect,
}: TimeStepProps) {
  // Filtrer uniquement les creneaux avec places disponibles
  const availableSlots = slotsForSelectedDate.filter((slot) => {
    return slot.remainingCapacity === null || slot.remainingCapacity > 0;
  });

  if (!selectedDate) return null;

  return (
    <>
      <h2 className="text-xl font-bold text-derviche-dark mb-4">
        Créneaux disponibles le{' '}
        {selectedDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </h2>
      {availableSlots.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          Aucun créneau disponible pour cette date.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableSlots.map((slot) => (
              <Button
                key={slot.id}
                variant="outline"
                onClick={() => onSlotSelect(slot)}
                disabled={isAdminRole}
                className={`h-auto py-3 flex flex-col items-center ${
                  isAdminRole
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:bg-derviche hover:text-white hover:border-derviche'
                }`}
              >
                <span className="font-semibold text-base">{slot.time}</span>
                <span className="text-xs opacity-70 mt-0.5">{slot.venueName}</span>
              </Button>
            ))}
          </div>

          {/* Message pour les admins */}
          {isAdminRole && (
            <p className="text-sm text-muted-foreground text-center mt-4 italic">
              Consultation uniquement &mdash; réservation via l&apos;admin
            </p>
          )}
        </>
      )}
    </>
  );
}
