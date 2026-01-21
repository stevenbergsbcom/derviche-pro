/**
 * Page Réservations - Espace Compagnie
 * Derviche Diffusion
 * 
 * Affichage en lecture seule des réservations des spectacles de la compagnie
 * Fonctionnalités : filtres, tri, export CSV/Excel
 */

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useCompanyReservations,
  type CompanyExportOptions,
} from '@/hooks/useCompanyReservations';

// Composants compagnie
import {
  type PeriodPreset,
  type DatePreset,
  type SortOption,
  SORT_OPTIONS,
  COLUMN_HEADERS,
  getDatePresetRange,
  CompanySortableHeader,
  renderCompanyTableCell,
  CompanyExportDialog,
} from '@/components/company/reservations';

// UI Components
import { Card, CardContent } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Loader2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  Calendar,
  CheckCircle,
  Ban,
  RefreshCw,
  Filter,
  Download,
  Heart,
  Newspaper,
  Meh,
} from 'lucide-react';
import type { CompanyExportColumn } from '@/lib/services/company-reservations';
import type { ReservationStatus, CheckinStatus } from '@/types/database';

// ============================================
// COLONNES VISIBLES PAR DÉFAUT
// ============================================

const DEFAULT_VISIBLE_COLUMNS: CompanyExportColumn[] = [
  'date',
  'spectacle',
  'lastName',
  'firstName',
  'email',
  'numPlaces',
  'status',
  'checkinStatus',
];

// ============================================
// COMPOSANT PAGE PRINCIPAL
// ============================================

export default function CompanyReservationsPage() {
  // Hooks
  const {
    reservations,
    total,
    page,
    totalPages,
    isLoading,
    error,
    stats,
    filters,
    shows,
    loadReservations,
    loadStats,
    loadShows,
    exportWithOptions,
    setPage,
    setPageSize,
    pageSize,
    setFilters,
  } = useCompanyReservations(50);

  // États locaux - Recherche avec debounce
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [isSearching, setIsSearching] = useState(false);
  const previousSearchRef = useRef<string | undefined>(undefined);
  
  // Refs pour avoir toujours les dernières valeurs
  const filtersRef = useRef(filters);
  const pageSizeRef = useRef(pageSize);
  const loadReservationsRef = useRef(loadReservations);
  
  // États dialogs
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // États UI
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // États filtres de date
  const [datePreset, setDatePreset] = useState<DatePreset | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Colonnes visibles (fixes pour la compagnie)
  const visibleColumns = DEFAULT_VISIBLE_COLUMNS;

  // Chargement initial
  useEffect(() => {
    void loadReservations({ period: 'upcoming', sortBy: 'slot_date_asc' });
    void loadStats();
    void loadShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre à jour les refs
  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { pageSizeRef.current = pageSize; }, [pageSize]);
  useEffect(() => { loadReservationsRef.current = loadReservations; }, [loadReservations]);

  // Effet de recherche avec debounce
  useEffect(() => {
    if (previousSearchRef.current === undefined && debouncedSearch === '') {
      previousSearchRef.current = '';
      return;
    }
    if (previousSearchRef.current === debouncedSearch) return;
    
    previousSearchRef.current = debouncedSearch;
    setIsSearching(true);
    
    const newFilters = { ...filtersRef.current, search: debouncedSearch.trim() || undefined };
    
    const doSearch = async () => {
      try {
        await loadReservationsRef.current(newFilters, { page: 1, pageSize: pageSizeRef.current });
      } finally {
        setIsSearching(false);
      }
    };
    
    void doSearch();
  }, [debouncedSearch]);

  const isDebouncing = searchInput !== debouncedSearch;

  // ============================================
  // HANDLERS
  // ============================================

  const handleClearSearch = useCallback(() => setSearchInput(''), []);

  const handleShowFilter = (showId: string) => {
    setFilters({ ...filters, showId: showId === 'all' ? undefined : showId });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status: status === 'all' ? undefined : status as ReservationStatus });
  };

  const handleCheckinFilter = (checkinStatus: string) => {
    setFilters({ ...filters, checkinStatus: checkinStatus === 'all' ? undefined : checkinStatus as CheckinStatus });
  };

  const handlePeriodFilter = (period: string) => {
    setDateFrom('');
    setDateTo('');
    setDatePreset(null);
    setFilters({ ...filters, period: period as PeriodPreset, dateFrom: undefined, dateTo: undefined });
  };

  const handleDatePreset = (preset: DatePreset) => {
    if (preset === 'custom') {
      setDatePreset('custom');
      return;
    }
    const range = getDatePresetRange(preset);
    setDatePreset(preset);
    setDateFrom(range.dateFrom || '');
    setDateTo(range.dateTo || '');
    setFilters({ ...filters, period: undefined, dateFrom: range.dateFrom, dateTo: range.dateTo });
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setDatePreset('custom');
    setFilters({ ...filters, period: undefined, dateFrom: value || undefined });
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setDatePreset('custom');
    setFilters({ ...filters, period: undefined, dateTo: value || undefined });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDateFrom('');
    setDateTo('');
    setDatePreset(null);
    setFilters({ period: 'upcoming', sortBy: 'slot_date_asc' });
  };

  const handleSortChange = (sortBy: SortOption | string | undefined) => {
    setFilters({ ...filters, sortBy: (sortBy || 'slot_date_asc') as SortOption });
  };

  const handleExportWithOptions = async (options: CompanyExportOptions): Promise<{ success: boolean; error?: string }> => {
    setIsExporting(true);
    const result = await exportWithOptions(options);
    setIsExporting(false);
    return result;
  };

  const handleRefresh = () => {
    void loadReservations(filters, { page, pageSize });
    void loadStats();
  };

  // Compteur de filtres actifs
  const activeFiltersCount = [
    filters.showId, 
    filters.status, 
    filters.checkinStatus,
    filters.search, 
    filters.dateFrom, 
    filters.dateTo,
    filters.period && filters.period !== 'upcoming' ? filters.period : null,
    filters.sortBy && filters.sortBy !== 'slot_date_asc' ? filters.sortBy : null,
  ].filter(Boolean).length;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-derviche-dark flex items-center gap-2">
            <Calendar className="w-7 h-7 text-gold" />
            Réservations
          </h1>
          <p className="text-muted-foreground">
            Consultez les réservations de vos spectacles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportDialogOpen(true)}
            disabled={reservations.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (() => {
        const confirmedPercent = stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0;
        const totalPresents = stats.presentLoved + stats.presentPress + stats.presentNeutral;
        const presentsPercent = stats.confirmed > 0 ? Math.round((totalPresents / stats.confirmed) * 100) : 0;
        const cancelledPercent = stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0;
        
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="py-1 bg-card/80 border-muted-foreground/10">
              <CardContent className="px-3 py-2">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Total réservations</p>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4 text-derviche" />
                  <span className="text-xl md:text-2xl font-bold">{stats.total}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stats.totalPlaces} places réservées</p>
              </CardContent>
            </Card>
            
            <Card className="py-1 bg-card/80 border-muted-foreground/10">
              <CardContent className="px-3 py-2">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Confirmées</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xl md:text-2xl font-bold">{stats.confirmed}</span>
                  <span className="text-xs text-green-600 font-medium">{confirmedPercent}%</span>
                </div>
                <Progress value={confirmedPercent} className="h-1.5 mt-2 bg-green-100 [&>div]:bg-green-500" />
              </CardContent>
            </Card>
            
            <Card className="py-1 bg-card/80 border-muted-foreground/10">
              <CardContent className="px-3 py-2">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Présents (check-in)</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex -space-x-1">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <Newspaper className="w-4 h-4 text-blue-500" />
                    <Meh className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-xl md:text-2xl font-bold">{totalPresents}</span>
                  <span className="text-xs text-blue-600 font-medium">{presentsPercent}%</span>
                </div>
                <div className="flex gap-2 text-xs mt-2 text-muted-foreground">
                  <span title="A aimé">❤️ {stats.presentLoved}</span>
                  <span title="Presse">📰 {stats.presentPress}</span>
                  <span title="Neutre">😐 {stats.presentNeutral}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="py-1 bg-card/80 border-muted-foreground/10">
              <CardContent className="px-3 py-2">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Annulées / Absents</p>
                <div className="flex items-center gap-2 mt-1">
                  <Ban className="w-4 h-4 text-red-500" />
                  <span className="text-xl md:text-2xl font-bold">{stats.cancelled + stats.absent}</span>
                  <span className="text-xs text-red-500 font-medium">{cancelledPercent}%</span>
                </div>
                <div className="flex gap-2 text-xs mt-2 text-muted-foreground">
                  <span>Annulées: {stats.cancelled}</span>
                  <span>Absents: {stats.absent}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Filtres */}
      <Card className="bg-card/80">
        <CardContent className="p-3 md:p-4">
          {/* Ligne principale : recherche + bouton filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {(isSearching || isDebouncing) && (
                <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Bouton Filtres */}
            <Button
              variant="outline"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Filtres étendus */}
          {filtersExpanded && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Filtre Spectacle */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Spectacle</Label>
                  <Select value={filters.showId || 'all'} onValueChange={handleShowFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tous les spectacles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les spectacles</SelectItem>
                      {shows.map((show) => (
                        <SelectItem key={show.id} value={show.id}>
                          {show.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre Statut */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Statut</Label>
                  <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="confirmed">Confirmées</SelectItem>
                      <SelectItem value="cancelled">Annulées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre Check-in */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Check-in</Label>
                  <Select value={filters.checkinStatus || 'all'} onValueChange={handleCheckinFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="present_loved">❤️ A aimé</SelectItem>
                      <SelectItem value="present_press">📰 Presse</SelectItem>
                      <SelectItem value="present_neutral">😐 Neutre</SelectItem>
                      <SelectItem value="absent">❌ Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre Période */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Période</Label>
                  <Select value={filters.period || 'all'} onValueChange={handlePeriodFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Toutes les périodes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les périodes</SelectItem>
                      <SelectItem value="upcoming">À venir</SelectItem>
                      <SelectItem value="past">Passées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filtres de date avancés */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Période rapide</Label>
                  <div className="flex gap-1">
                    {[
                      { value: 'this_week', label: 'Cette semaine' },
                      { value: 'this_month', label: 'Ce mois' },
                      { value: 'next_month', label: 'Mois prochain' },
                    ].map((preset) => (
                      <Button
                        key={preset.value}
                        type="button"
                        variant={datePreset === preset.value ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleDatePreset(preset.value as DatePreset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Du</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="h-9 w-36"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Au</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="h-9 w-36"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9"
                >
                  <X className="w-4 h-4 mr-1" />
                  Réinitialiser
                </Button>
              </div>

              {/* Tri */}
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Trier par :</Label>
                <Select value={filters.sortBy || 'slot_date_asc'} onValueChange={handleSortChange}>
                  <SelectTrigger className="h-8 w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tableau */}
      <Card className="bg-card/80">
        <CardContent className="p-0">
          {/* Info résultats */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="text-sm text-muted-foreground">
              {total} réservation{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Par page:</Label>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  {visibleColumns.map((col) => (
                    <CompanySortableHeader
                      key={col}
                      column={col}
                      label={COLUMN_HEADERS[col]}
                      currentSort={filters.sortBy as SortOption | undefined}
                      onSort={handleSortChange}
                      className="text-xs"
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={visibleColumns.length} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
                    </td>
                  </tr>
                ) : reservations.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length} className="text-center py-12">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30" />
                      <p className="text-muted-foreground mt-2">Aucune réservation trouvée</p>
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-2"
                        >
                          Réinitialiser les filtres
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  reservations.map((reservation) => (
                    <tr
                      key={reservation.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {visibleColumns.map((col) => (
                        <td key={col} className="px-2 py-3 text-sm">
                          {renderCompanyTableCell(col, reservation)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {/* Numéros de page */}
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8 text-xs"
                        onClick={() => setPage(pageNum)}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Export */}
      <CompanyExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reservations={reservations}
        filters={filters}
        visibleColumns={visibleColumns}
        onExport={handleExportWithOptions}
        isExporting={isExporting}
      />
    </div>
  );
}
