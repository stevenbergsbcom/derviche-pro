/**
 * CompareSelector - Switch « Comparer » + Select de preset (Phase 3)
 * Derviche Diffusion
 *
 * Active/désactive la comparaison entre périodes et sélectionne le preset :
 * - Année précédente (N-1)
 * - Période équivalente précédente
 * - Saison précédente (seulement si période courante = saison courante)
 */

'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { COMPARE_PRESET_LABELS } from '@/lib/services/admin-stats';
import type { ComparePreset, StatsPeriod } from '@/lib/services/admin-stats';

export interface CompareSelectorProps {
  enabled: boolean;
  preset?: ComparePreset;
  period: StatsPeriod;
  disabled?: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onPresetChange: (preset: ComparePreset) => void;
}

export function CompareSelector({
  enabled,
  preset,
  period,
  disabled,
  onEnabledChange,
  onPresetChange,
}: CompareSelectorProps) {
  // Fallback d'affichage lorsque le preset n'est pas encore hydraté.
  const currentPreset: ComparePreset = preset ?? 'year_before';

  return (
    <div className="flex items-end gap-3">
      <div className="flex items-center gap-2 pb-1">
        <Switch
          id="compare-mode"
          checked={enabled}
          disabled={disabled}
          onCheckedChange={onEnabledChange}
          aria-label="Activer la comparaison entre périodes"
        />
        <Label htmlFor="compare-mode" className="cursor-pointer text-sm">
          Comparer
        </Label>
      </div>

      {enabled && (
        <Select
          value={currentPreset}
          onValueChange={(v) => onPresetChange(v as ComparePreset)}
          disabled={disabled}
        >
          <SelectTrigger
            className="h-9 w-[220px]"
            aria-label="Choisir la période de comparaison"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="year_before">
              {COMPARE_PRESET_LABELS.year_before}
            </SelectItem>
            <SelectItem value="previous_equivalent">
              {COMPARE_PRESET_LABELS.previous_equivalent}
            </SelectItem>
            <SelectItem
              value="previous_season"
              disabled={period !== 'season_current'}
            >
              {COMPARE_PRESET_LABELS.previous_season}
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
