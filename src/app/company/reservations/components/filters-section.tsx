/**
 * Composant FiltersSection pour la page des réservations compagnie
 * Panneau avancé collapsible : statut, checkin, tri, période, dates
 * Aligné sur admin/reservations (spectacle déplacé dans SearchAndActions) — S166
 * Derviche Diffusion
 */

'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
import { type SortOption, SORT_OPTIONS } from '@/components/company/reservations';
import type { CompanyReservationFilters } from '@/lib/services/company-reservations';
import type { DatePreset } from '../types';

// ============================================
// TYPES
// ============================================

export interface FiltersSectionProps {
  /** État actuel des filtres */
  filters: CompanyReservationFilters;
  /** Le panneau est-il visible ? (contrôlé par le bouton Filtres dans SearchAndActions) */
  filtersExpanded: boolean;
  /** Nombre de filtres avancés actifs (hors spectacle et recherche) */
  activeFiltersCount: number;

  // États locaux des dates
  datePreset: DatePreset | null;
  dateFrom: string;
  dateTo: string;

  // Handlers
  onStatusFilter: (status: string) => void;
  onCheckinFilter: (status: string) => void;
  onSortChange: (sortBy: SortOption | undefined) => void;
  onPeriodFilter: (period: string) => void;
  onDatePreset: (preset: DatePreset) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onResetFilters: () => void;
}

// ============================================
// COMPOSANT
// ============================================

function FiltersSectionComponent({
  filters,
  filtersExpanded,
  activeFiltersCount,
  datePreset,
  dateFrom,
  dateTo,
  onStatusFilter,
  onCheckinFilter,
  onSortChange,
  onPeriodFilter,
  onDatePreset,
  onDateFromChange,
  onDateToChange,
  onResetFilters,
}: FiltersSectionProps) {
  const hasDateFilters = !!(filters.dateFrom || filters.dateTo);

  // Panneau caché si pas expanded (comportement identique à admin, toutes tailles d'écran)
  if (!filtersExpanded) return null;

  return (
    <div className="space-y-3 border rounded-lg p-3 bg-card/50">
      {/* Ligne 1 : Statut, Check-in, Tri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Filtre Statut */}
        <div className="space-y-1">
          <Label className="text-xs">Statut</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={onStatusFilter}
          >
            <SelectTrigger aria-label="Filtrer par statut">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="confirmed">Confirmées</SelectItem>
              <SelectItem value="cancelled">Annulées</SelectItem>
              <SelectItem value="no_show">No-show</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtre Check-in */}
        <div className="space-y-1">
          <Label className="text-xs">Check-in</Label>
          <Select
            value={filters.checkinStatus || 'all'}
            onValueChange={onCheckinFilter}
          >
            <SelectTrigger aria-label="Filtrer par check-in">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="present_loved">Présent - A aimé</SelectItem>
              <SelectItem value="present_press">Présent - Presse</SelectItem>
              <SelectItem value="present_neutral">Présent - Neutre</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtre Tri */}
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
            Tri
          </Label>
          <Select
            value={filters.sortBy || 'slot_date_asc'}
            onValueChange={(v) => onSortChange(v as SortOption)}
          >
            <SelectTrigger aria-label="Trier les résultats">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ligne 2 : Période, Raccourci, Dates, Reset */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">

        {/* Filtre Période */}
        <div className="space-y-1">
          <Label className="text-xs">Période</Label>
          <Select
            value={hasDateFilters ? 'all' : filters.period || 'upcoming'}
            onValueChange={onPeriodFilter}
            disabled={hasDateFilters}
          >
            <SelectTrigger
              aria-label="Filtrer par période"
              className={hasDateFilters ? 'opacity-50' : ''}
            >
              <SelectValue placeholder="À venir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">À venir</SelectItem>
              <SelectItem value="past">Passées</SelectItem>
              <SelectItem value="all">Toutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Raccourci de date */}
        <div className="space-y-1">
          <Label className="text-xs">Raccourci</Label>
          <Select
            value={datePreset || ''}
            onValueChange={(v) => onDatePreset(v as DatePreset)}
          >
            <SelectTrigger aria-label="Raccourci de date">
              <SelectValue placeholder="Choisir..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">Cette semaine</SelectItem>
              <SelectItem value="this_month">Ce mois</SelectItem>
              <SelectItem value="next_month">Mois prochain</SelectItem>
              <SelectItem value="custom">Personnalisé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date de début */}
        <div className="space-y-1">
          <Label className="text-xs">Du</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>

        {/* Date de fin */}
        <div className="space-y-1">
          <Label className="text-xs">Au</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>

        {/* Bouton Reset */}
        <div className="flex items-end">
          <Button
            variant={activeFiltersCount > 0 ? 'default' : 'ghost'}
            onClick={onResetFilters}
            size="sm"
            className={`w-full ${
              activeFiltersCount > 0
                ? 'bg-derviche/10 text-derviche hover:bg-derviche/20 border border-derviche/30'
                : ''
            }`}
          >
            Réinitialiser
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 bg-derviche text-white text-xs px-1.5 py-0"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

FiltersSectionComponent.displayName = 'FiltersSection';

export const FiltersSection = memo(FiltersSectionComponent);
