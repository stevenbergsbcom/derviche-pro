/**
 * Composant FiltersSection pour la page des réservations admin
 * Panneau avancé (caché par défaut) : statut, tri, période, dates, reset
 * Spectacle et recherche sont sur la ligne principale (SearchAndActions)
 * Derviche Diffusion — S163
 */

'use client';

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
import {
  type DatePreset,
  type SortOption,
  SORT_OPTIONS,
} from '@/components/admin/reservations';
import type { ReservationFiltersState } from '../hooks';

// ============================================
// TYPES
// ============================================

export interface FiltersSectionProps {
  filters: ReservationFiltersState;
  filtersExpanded: boolean;
  activeFiltersCount: number;

  // États locaux des dates
  datePreset: DatePreset | null;
  dateFrom: string;
  dateTo: string;

  // Handlers
  onStatusFilter: (status: string) => void;
  onSortChange: (sortBy: SortOption | string | undefined) => void;
  onPeriodFilter: (period: string) => void;
  onDatePreset: (preset: DatePreset) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onResetFilters: () => void;
}

// ============================================
// COMPOSANT
// ============================================

export function FiltersSection({
  filters,
  filtersExpanded,
  activeFiltersCount,
  datePreset,
  dateFrom,
  dateTo,
  onStatusFilter,
  onSortChange,
  onPeriodFilter,
  onDatePreset,
  onDateFromChange,
  onDateToChange,
  onResetFilters,
}: FiltersSectionProps) {
  const hasDateFilters = !!(filters.dateFrom || filters.dateTo);

  if (!filtersExpanded) return null;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-3">

      {/* Ligne : Statut, Tri, Période, Raccourci, Du, Au, Reset */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 items-end">

        {/* Statut */}
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

        {/* Tri */}
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" />
            Tri
          </Label>
          <Select
            value={filters.sortBy || 'slot_date_asc'}
            onValueChange={onSortChange}
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

        {/* Période */}
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

        {/* Date début */}
        <div className="space-y-1">
          <Label className="text-xs">Du</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>

        {/* Date fin */}
        <div className="space-y-1">
          <Label className="text-xs">Au</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>

        {/* Réinitialiser */}
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
              <Badge className="ml-1.5 bg-derviche text-white text-xs px-1.5 py-0 h-4">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
