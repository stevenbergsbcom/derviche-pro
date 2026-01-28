/**
 * Composant WeekDaysSection - Sélection jours de la semaine
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { WEEK_DAY_LABELS } from '../constants';
import type { WeekDaysSectionProps } from '../types';

export function WeekDaysSection({
  weekDays,
  onWeekDayChange,
}: WeekDaysSectionProps) {
  return (
    <div className="space-y-2">
      <Label>
        Jours de la semaine <span className="text-destructive">*</span>
      </Label>
      <div 
        className="grid grid-cols-4 sm:grid-cols-7 gap-2"
        role="group"
        aria-label="Sélection des jours de la semaine"
      >
        {WEEK_DAY_LABELS.map((label, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Checkbox
              id={`series-day-${index}`}
              checked={weekDays[index]}
              onCheckedChange={(checked) => {
                onWeekDayChange(index, checked === true);
              }}
            />
            <Label 
              htmlFor={`series-day-${index}`} 
              className="font-normal cursor-pointer text-sm"
            >
              {label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
