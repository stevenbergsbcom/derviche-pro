/**
 * Composant FiltersSection pour la page des réservations compagnie
 * Filtres collapsibles : spectacle, statut, checkin, tri, période, dates
 * Structure identique à admin/reservations (SANS recherche)
 * Derviche Diffusion - Session 119
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
import { Filter, ChevronDown, ArrowUpDown } from 'lucide-react';
import { type SortOption, SORT_OPTIONS } from '@/components/company/reservations';
import type { CompanyReservationFilters } from '@/lib/services/company-reservations';
import type { DatePreset } from '../types';

// ============================================
// TYPES
// ============================================

export interface ShowOption {
  id: string;
  title: string;
  slug: string;
}

export interface FiltersSectionProps {
  /** État actuel des filtres */
  filters: CompanyReservationFilters;
  /** Options de spectacles disponibles */
  showsOptions: ShowOption[];
  /** État d'expansion sur mobile */
  filtersExpanded: boolean;
  /** Nombre de filtres actifs */
  activeFiltersCount: number;
  
  // États locaux des dates
  datePreset: DatePreset | null;
  dateFrom: string;
  dateTo: string;
  
  // Handlers
  onToggleExpanded: () => void;
  onShowFilter: (showId: string) => void;
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
  showsOptions,
  filtersExpanded,
  activeFiltersCount,
  datePreset,
  dateFrom,
  dateTo,
  onToggleExpanded,
  onShowFilter,
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

  return (
    <>
      {/* Toggle filtres (mobile) */}
      <div className="md:hidden">
        <Button
          variant="outline"
          onClick={onToggleExpanded}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" aria-hidden="true" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </span>
          <ChevronDown 
            aria-hidden="true"
            className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} 
          />
        </Button>
      </div>

      {/* Filtres */}
      <div className={`space-y-3 ${filtersExpanded ? 'block' : 'hidden md:block'}`}>
        {/* Ligne 1 : Spectacle, Statut, Check-in, Tri */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Filtre Spectacle */}
          <div className="space-y-1">
            <Label className="text-xs">Spectacle</Label>
            <Select 
              value={filters.showId || 'all'} 
              onValueChange={onShowFilter}
            >
              <SelectTrigger aria-label="Filtrer par spectacle">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous vos spectacles</SelectItem>
                {showsOptions.map((show) => (
                  <SelectItem key={show.id} value={show.id}>
                    {show.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
    </>
  );
}

FiltersSectionComponent.displayName = 'FiltersSection';

export const FiltersSection = memo(FiltersSectionComponent);
