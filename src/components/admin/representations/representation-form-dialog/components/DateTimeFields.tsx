/**
 * Composant DateTimeFields - Champs date et heure
 * Derviche Diffusion - Session 103
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { DateTimeFieldsProps } from '../types';
import { LABELS } from '../constants';

/**
 * Champs date et heure de la représentation
 */
export function DateTimeFields({
  date,
  time,
  onDateChange,
  onTimeChange,
  minDate,
  disabled,
  isEditing,
}: DateTimeFieldsProps) {
  const disabledClassName = disabled
    ? 'bg-muted text-muted-foreground cursor-not-allowed'
    : '';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Champ Date */}
      <div className="space-y-2">
        <Label htmlFor="representation-date">
          {LABELS.date} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="representation-date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          min={
            // En mode création : empêcher les dates passées
            // En mode édition : pas de min (champ potentiellement disabled ou date passée existante)
            isEditing ? undefined : minDate
          }
          required
          disabled={disabled}
          className={disabledClassName}
          aria-describedby={disabled ? 'datetime-disabled-notice' : undefined}
        />
      </div>

      {/* Champ Heure */}
      <div className="space-y-2">
        <Label htmlFor="representation-time">
          {LABELS.time} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="representation-time"
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          required
          disabled={disabled}
          className={disabledClassName}
          aria-describedby={disabled ? 'datetime-disabled-notice' : undefined}
        />
      </div>

      {/* Notice invisible pour les lecteurs d'écran */}
      {disabled && (
        <span id="datetime-disabled-notice" className="sr-only">
          Ces champs sont désactivés car la représentation a des réservations
        </span>
      )}
    </div>
  );
}
