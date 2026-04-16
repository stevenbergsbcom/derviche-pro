/**
 * Section Statistiques - Préférences admin pour /admin/statistiques
 * Derviche Diffusion — Phase 4A
 *
 * Phase 4A : seules les colonnes cachées sont appliquées aux tables stats.
 * Les 4 autres préférences (période, taille de page, preset compare, format export)
 * sont stockées et éditables mais pas encore consommées (note UI).
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { SettingsCard } from '../shared';
import { StatisticsColumnVisibility } from './statistics-column-visibility';

import { useStatsSettings } from '@/hooks/app-settings';
import {
  HIDEABLE_SHOWS_COLUMNS,
  HIDEABLE_VENUES_COLUMNS,
  STATS_DEFAULTS,
  type StatsSettings,
} from '@/lib/services/app-settings';
import {
  COMPARE_PRESET_LABELS,
  STATS_PERIOD_LABELS,
  type ComparePreset,
  type StatsPeriod,
} from '@/lib/services/admin-stats';

// ============================================
// PROPS
// ============================================

interface StatisticsSectionProps {
  canEdit: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// CONSTANTES
// ============================================

const PERIOD_OPTIONS: StatsPeriod[] = [
  'month_current',
  'month_previous',
  'season_current',
  'year_current',
  'all',
  'custom',
];

const COMPARE_OPTIONS: ComparePreset[] = [
  'year_before',
  'previous_equivalent',
  'previous_season',
];

const EXPORT_OPTIONS: { value: StatsSettings['stats_default_export_format']; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

const FUTURE_NOTE = 'Sera appliqué automatiquement dans une prochaine version.';

// ============================================
// COMPONENT
// ============================================

export function StatisticsSection({ canEdit, onDirtyChange }: StatisticsSectionProps) {
  const { data, isLoading, isSaving, error, update } = useStatsSettings();
  const [hasChanges, setHasChanges] = useState(false);

  // Ref pour callback (anti-loop)
  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });

  // État local du formulaire
  const [formData, setFormData] = useState<StatsSettings>(STATS_DEFAULTS);
  const [initialData, setInitialData] = useState<StatsSettings | null>(null);
  const hasInitialData = initialData !== null;

  // Init au chargement des données
  useEffect(() => {
    if (data) {
      setFormData(data);
      setInitialData(data);
    }
  }, [data]);

  // Détection dirty
  useEffect(() => {
    if (!hasInitialData || !initialData) return;
    const changed = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasChanges(changed);
    onDirtyChangeRef.current?.(changed);
  }, [formData, initialData, hasInitialData]);

  // Validation page size (border clamp léger avant submit)
  const clampPageSize = (n: number): number => {
    if (!Number.isFinite(n)) return STATS_DEFAULTS.stats_default_page_size;
    return Math.max(10, Math.min(100, Math.round(n)));
  };

  // Submit
  const onSubmit = async () => {
    const payload: StatsSettings = {
      ...formData,
      stats_default_page_size: clampPageSize(formData.stats_default_page_size),
    };

    const result = await update(payload);

    if (result.success) {
      toast.success('Préférences statistiques enregistrées');
      setFormData(payload);
      setInitialData(payload);
      setHasChanges(false);
      onDirtyChange?.(false);
    } else {
      toast.error(result.error || 'Erreur lors de la sauvegarde');
    }
  };

  if (error) {
    return (
      <SettingsCard
        icon={BarChart3}
        title="Préférences statistiques"
        description="Défauts de /admin/statistiques"
        canEdit={false}
      >
        <p className="text-sm text-destructive">Erreur : {error}</p>
      </SettingsCard>
    );
  }

  return (
    <div className="space-y-4">
      <SettingsCard
        icon={BarChart3}
        title="Préférences statistiques"
        description="Défauts appliqués lors de l'ouverture de /admin/statistiques."
        isLoading={isLoading}
        isSaving={isSaving}
        canEdit={canEdit}
        hasChanges={hasChanges}
        onSubmit={onSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* Période par défaut */}
          <div className="space-y-2">
            <Label htmlFor="stats-default-period">Période par défaut</Label>
            <Select
              value={formData.stats_default_period}
              onValueChange={(value) =>
                setFormData({ ...formData, stats_default_period: value as StatsPeriod })
              }
              disabled={!canEdit}
            >
              <SelectTrigger id="stats-default-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {STATS_PERIOD_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{FUTURE_NOTE}</p>
          </div>

          {/* Taille de page */}
          <div className="space-y-2">
            <Label htmlFor="stats-page-size">Taille de page</Label>
            <div className="flex items-center gap-2">
              <Input
                id="stats-page-size"
                type="number"
                min={10}
                max={100}
                className="w-24"
                value={formData.stats_default_page_size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stats_default_page_size: Number(e.target.value),
                  })
                }
                disabled={!canEdit}
              />
              <span className="text-sm text-muted-foreground">lignes</span>
            </div>
            <p className="text-xs text-muted-foreground">{FUTURE_NOTE}</p>
          </div>

          {/* Preset de comparaison */}
          <div className="space-y-2">
            <Label htmlFor="stats-compare-preset">Preset de comparaison par défaut</Label>
            <Select
              value={formData.stats_default_compare_preset}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  stats_default_compare_preset: value as ComparePreset,
                })
              }
              disabled={!canEdit}
            >
              <SelectTrigger id="stats-compare-preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPARE_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {COMPARE_PRESET_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{FUTURE_NOTE}</p>
          </div>

          {/* Format d'export */}
          <div className="space-y-2">
            <Label htmlFor="stats-export-format">Format d&apos;export par défaut</Label>
            <Select
              value={formData.stats_default_export_format}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  stats_default_export_format:
                    value as StatsSettings['stats_default_export_format'],
                })
              }
              disabled={!canEdit}
            >
              <SelectTrigger id="stats-export-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{FUTURE_NOTE}</p>
          </div>
        </div>

        <Separator />

        <StatisticsColumnVisibility
          title={'Tableau « Par spectacle »'}
          description="Colonnes cochées = masquées. Le titre du spectacle reste toujours visible."
          hideableColumns={HIDEABLE_SHOWS_COLUMNS}
          hiddenColumns={formData.stats_hidden_columns_shows}
          disabled={!canEdit}
          onChange={(next) =>
            setFormData({ ...formData, stats_hidden_columns_shows: next })
          }
        />

        <StatisticsColumnVisibility
          title={'Tableau « Par lieu »'}
          description="Colonnes cochées = masquées. Le nom du lieu reste toujours visible."
          hideableColumns={HIDEABLE_VENUES_COLUMNS}
          hiddenColumns={formData.stats_hidden_columns_venues}
          disabled={!canEdit}
          onChange={(next) =>
            setFormData({ ...formData, stats_hidden_columns_venues: next })
          }
        />
      </SettingsCard>
    </div>
  );
}
