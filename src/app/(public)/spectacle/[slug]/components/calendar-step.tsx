/**
 * CalendarStep — Grille calendrier + navigation mois
 * Derviche Diffusion - Page spectacle
 */

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info, Globe } from 'lucide-react';
import { formatMonthYear, createDateKey, isSameDay } from '../utils/calendar';

// ============================================
// PROPS
// ============================================

interface CalendarStepProps {
  isComingSoon: boolean;
  currentMonth: Date;
  calendarDays: (Date | null)[];
  datesWithSlots: Set<string>;
  selectedDate: Date | null;
  onDayClick: (date: Date | null) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function CalendarStep({
  isComingSoon,
  currentMonth,
  calendarDays,
  datesWithSlots,
  selectedDate,
  onDayClick,
  onPreviousMonth,
  onNextMonth,
}: CalendarStepProps) {
  const hasSlots = (date: Date | null): boolean => {
    if (!date) return false;
    return datesWithSlots.has(createDateKey(date));
  };

  const isSelected = (date: Date | null): boolean => {
    if (!date || !selectedDate) return false;
    return isSameDay(date, selectedDate);
  };

  return (
    <>
      <h2 className="text-xl font-bold text-derviche-dark mb-6">
        {isComingSoon
          ? 'Réservations bientôt disponibles'
          : "Sélectionnez la date et l\u2019heure"}
      </h2>

      {/* Message si spectacle bientot reservable */}
      {isComingSoon && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Bientôt réservable</p>
              <p className="text-muted-foreground">
                Les réservations pour ce spectacle ne sont pas encore ouvertes. Revenez bientôt !
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendrier uniquement si pas coming_soon */}
      {!isComingSoon && (
        <>
          {/* Navigation mois */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPreviousMonth}
              className="rounded-full h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold text-derviche-dark capitalize">
              {formatMonthYear(currentMonth)}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNextMonth}
              className="rounded-full h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Grille calendrier */}
          <div className="mb-6">
            {/* En-tetes jours */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.', 'DIM.'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Jours du mois */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const hasSlotsForDate = hasSlots(date);
                const isDateSelected = isSelected(date);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => onDayClick(date)}
                    disabled={!hasSlotsForDate}
                    /*
                      iOS Safari < 16.2 : `bg-derviche/10` compile en
                      `color-mix(...)` non supporté, ce qui rend la
                      déclaration `background-color` invalide. Sans bg
                      explicite, iOS Safari applique son style de bouton
                      par défaut (teinte bleue système) → texte derviche
                      sur fond bleu système ≈ invisible. On utilise donc
                      des tokens dédiés `bg-derviche-muted` (oklch direct,
                      sans color-mix) + `appearance-none` pour neutraliser
                      le style natif iOS.
                    */
                    className={`
                      aspect-square rounded-lg text-sm font-medium transition-colors appearance-none
                      ${
                        isDateSelected
                          ? 'bg-derviche text-white'
                          : hasSlotsForDate
                            ? 'bg-derviche-muted text-derviche hover:bg-derviche-muted-hover cursor-pointer'
                            : 'bg-transparent text-muted-foreground/30 cursor-not-allowed'
                      }
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fuseau horaire */}
          <div className="mt-8 pt-6 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span>Fuseau horaire : Heure d&apos;Europe centrale</span>
          </div>
        </>
      )}
    </>
  );
}
