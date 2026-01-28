/**
 * Section paramètres (statut, durée, période, dates relâche)
 * Derviche Diffusion - Session 101
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ShowStatus } from '@/types/database';
import type { SettingsSectionProps } from '../types';
import { STATUS_OPTIONS } from '../constants';

export function SettingsSection({
  status,
  duration,
  period,
  closureDates,
  onStatusChange,
  onDurationChange,
  onPeriodChange,
  onClosureDatesChange,
}: SettingsSectionProps) {
  return (
    <>
      {/* Statut et Durée */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Statut *</Label>
          <Select
            value={status}
            onValueChange={(value: ShowStatus) => onStatusChange(value)}
            required
          >
            <SelectTrigger id="status" aria-label="Choisir un statut">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Durée (en minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={duration || ''}
            onChange={(e) => {
              const value = e.target.value;
              onDurationChange(value ? parseInt(value, 10) : null);
            }}
          />
        </div>
      </div>

      {/* Période */}
      <div className="space-y-2">
        <Label htmlFor="period">Période</Label>
        <Input
          id="period"
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
          placeholder="Ex: Automne 2025"
        />
      </div>

      {/* Dates de relâche */}
      <div className="space-y-2">
        <Label htmlFor="closureDates">Dates de relâche</Label>
        <Input
          id="closureDates"
          value={closureDates}
          onChange={(e) => onClosureDatesChange(e.target.value)}
          placeholder="Ex: Relâche le lundi"
        />
      </div>
    </>
  );
}
