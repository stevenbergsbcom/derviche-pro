/**
 * Composant PeriodSection - Sélection période (dates début/fin)
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { PeriodSectionProps } from '../types';

export function PeriodSection({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
}: PeriodSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="startDate">
          Date de début <span className="text-destructive">*</span>
        </Label>
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          min={minDate}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="endDate">
          Date de fin <span className="text-destructive">*</span>
        </Label>
        <Input
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          min={startDate || minDate}
          required
        />
      </div>
    </div>
  );
}
