'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { AdminPageHeader } from '@/components/admin';
import { useAdminReservations } from '@/hooks/useAdminReservations';
import { useShows } from '@/hooks/useShows';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useReservationColumnsPreference,
  type ReservationColumnsPreference,
} from '@/hooks/useUserPreferences';
import { ColumnSelectorDialog } from '@/components/admin/column-selector-dialog';
import { ExportDialog, type ExportOptions } from '@/components/admin/export-dialog';

// Composants extraits
import {
  // Types et constantes
  type PeriodPreset,
  type DatePreset,
  type SortOption,
  SORT_OPTIONS,
  COLUMN_HEADERS,
  // Helpers
  getDatePresetRange,
  renderTableCell,
  // Composants
  SortableHeader,
  RowHoverActions,
  ReservationCard,
  EditReservationDialog,
  CreateReservationDialog,
} from '@/components/admin/reservations';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Loader2,
  AlertTriangle,
  Heart,
  Newspaper,
  Meh,
  XCircle,
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
  Settings2,
  ArrowUpDown,
} from 'lucide-react';
import type { AdminReservation, UpdateReservationData, CheckinUpdateData, CreateAdminReservationData } from '@/lib/services/admin-reservations';
import { createAdminReservation } from '@/lib/services/admin-reservations';
import type { ReservationStatus, CheckinStatus } from '@/types/database';
import { toast } from 'sonner';

// ============================================
// COMPOSANT PAGE PRINCIPAL
// ============================================

export default function AdminReservationsPage() {
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
    loadReservations,
    loadStats,
    checkin,
    update,
    cancel,
    exportWithOptions,
    getSlots,
    setPage,
    setPageSize,
    pageSize,
    setFilters,
  } = useAdminReservations(50);

  const { shows, refresh: refreshShows } = useShows();
  const { 
    preference: columnsPreference, 
    visibleColumns, 
    isLoading: columnsLoading,
    setPreference: setColumnsPreference,
  } = useReservationColumnsPreference();

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
  const [selectedReservation, setSelectedReservation] = useState<AdminReservation | null>(null);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // États formulaires
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // États filtres de date
  const [datePreset, setDatePreset] = useState<DatePreset | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Chargement initial
  useEffect(() => {
    void loadReservations({ period: 'upcoming', sortBy: 'slot_date_asc' });
    void loadStats();
    void refreshShows();
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

  // Spectacles pour le filtre
  const showsOptions = useMemo(() => shows.filter(s => s.status === 'published'), [shows]);

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

  const handleCheckin = async (status: CheckinStatus) => {
    if (!selectedReservation) return;
    setIsProcessing(true);
    const data: CheckinUpdateData = { checkinStatus: status };
    const result = await checkin(selectedReservation.id, data);
    setIsProcessing(false);
    if (result.success) {
      setCheckinDialogOpen(false);
      setSelectedReservation(null);
      void loadStats();
    }
  };

  const handleCancel = async () => {
    if (!selectedReservation) return;
    setIsProcessing(true);
    const result = await cancel(selectedReservation.id, cancelReason || undefined);
    setIsProcessing(false);
    if (result.success) {
      setCancelDialogOpen(false);
      setSelectedReservation(null);
      setCancelReason('');
      void loadStats();
    }
  };

  const handleEdit = async (data: UpdateReservationData) => {
    if (!selectedReservation) return;
    setIsProcessing(true);
    const result = await update(selectedReservation.id, data);
    setIsProcessing(false);
    if (result.success) {
      setEditDialogOpen(false);
      setSelectedReservation(null);
      void loadStats();
    }
  };

  const handleCreate = async (data: CreateAdminReservationData) => {
    const result = await createAdminReservation(data);
    if (result.success) {
      void loadReservations();
      void loadStats();
    }
    return result;
  };

  const handleExportWithOptions = async (options: ExportOptions): Promise<{ success: boolean; error?: string }> => {
    setIsExporting(true);
    const result = await exportWithOptions(options);
    setIsExporting(false);
    return result;
  };

  const handleSaveColumns = async (newPreference: ReservationColumnsPreference): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);
    const result = await setColumnsPreference(newPreference);
    setIsProcessing(false);
    if (result.success) {
      setColumnsDialogOpen(false);
      toast.success('Préférences enregistrées');
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
    return result;
  };

  const openCheckinDialog = (reservation: AdminReservation) => {
    setSelectedReservation(reservation);
    setCheckinDialogOpen(true);
  };

  const openCancelDialog = (reservation: AdminReservation) => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
  };

  const openEditDialog = (reservation: AdminReservation) => {
    setSelectedReservation(reservation);
    setEditDialogOpen(true);
  };

  // Compteur de filtres actifs
  const activeFiltersCount = [
    filters.showId, 
    filters.status, 
    filters.search, 
    filters.dateFrom, 
    filters.dateTo,
    filters.period && filters.period !== 'upcoming' ? filters.period : null,
    filters.sortBy && filters.sortBy !== 'slot_date_asc' ? filters.sortBy : null,
  ].filter(Boolean).length;

  const columns = columnsLoading ? [] : visibleColumns;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-4 md:space-y-6">
      <AdminPageHeader
        title="Réservations"
        actionLabel="Nouvelle réservation"
        onAction={() => setCreateDialogOpen(true)}
      />

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
                <p className="text-xs text-muted-foreground mt-1">{stats.confirmed} / {stats.total}</p>
              </CardContent>
            </Card>
            
            <Card className="py-1 bg-card/80 border-muted-foreground/10">
              <CardContent className="px-3 py-2">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Présents (check-in)</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-xl md:text-2xl font-bold">{totalPresents}</span>
                  <span className="text-xs text-blue-600 font-medium">{presentsPercent}%</span>
                </div>
                <Progress value={presentsPercent} className="h-1.5 mt-2 bg-blue-100 [&>div]:bg-blue-500" />
                <p className="text-xs text-muted-foreground mt-1">{totalPresents} / {stats.confirmed} confirmées</p>
              </CardContent>
            </Card>
            
            <Card className="py-1 bg-card/80 border-muted-foreground/10">
              <CardContent className="px-3 py-2">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Annulées</p>
                <div className="flex items-center gap-2 mt-1">
                  <Ban className="w-4 h-4 text-red-600" />
                  <span className="text-xl md:text-2xl font-bold">{stats.cancelled}</span>
                  <span className="text-xs text-red-600 font-medium">{cancelledPercent}%</span>
                </div>
                <Progress value={cancelledPercent} className="h-1.5 mt-2 bg-red-100 [&>div]:bg-red-500" />
                <p className="text-xs text-muted-foreground mt-1">Taux d&apos;annulation</p>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Barre d'actions */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              {isSearching || isDebouncing ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-derviche animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              )}
              <Input
                placeholder="Rechercher par nom, email, téléphone, structure..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleClearSearch}
                  title="Effacer la recherche"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {filters.search && !isLoading && (
              <p className="text-xs text-muted-foreground mt-1 ml-1">
                {total} résultat{total > 1 ? 's' : ''} pour « {filters.search} »
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => void loadReservations()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setColumnsDialogOpen(true)} title="Colonnes">
              <Settings2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => setExportDialogOpen(true)} disabled={isExporting || reservations.length === 0}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Export</span>
            </Button>
          </div>
        </div>

        {/* Toggle filtres (mobile) */}
        <div className="md:hidden">
          <Button
            variant="outline"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtres
              {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount}</Badge>}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Filtres */}
        <div className={`space-y-3 ${filtersExpanded ? 'block' : 'hidden md:block'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Spectacle</Label>
              <Select value={filters.showId || 'all'} onValueChange={handleShowFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les spectacles</SelectItem>
                  {showsOptions.map((show) => (
                    <SelectItem key={show.id} value={show.id}>{show.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Statut</Label>
              <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger>
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
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Tri
              </Label>
              <Select value={filters.sortBy || 'slot_date_asc'} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Période</Label>
              <Select 
                value={(filters.dateFrom || filters.dateTo) ? 'all' : filters.period || 'upcoming'} 
                onValueChange={handlePeriodFilter}
                disabled={!!(filters.dateFrom || filters.dateTo)}
              >
                <SelectTrigger className={(filters.dateFrom || filters.dateTo) ? 'opacity-50' : ''}>
                  <SelectValue placeholder="À venir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">À venir</SelectItem>
                  <SelectItem value="past">Passées</SelectItem>
                  <SelectItem value="all">Toutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Raccourci</Label>
              <Select value={datePreset || ''} onValueChange={(v) => handleDatePreset(v as DatePreset)}>
                <SelectTrigger>
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
            <div className="space-y-1">
              <Label className="text-xs">Du</Label>
              <Input type="date" value={dateFrom} onChange={(e) => handleDateFromChange(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Au</Label>
              <Input type="date" value={dateTo} onChange={(e) => handleDateToChange(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button 
                variant={activeFiltersCount > 0 ? 'default' : 'ghost'} 
                onClick={handleResetFilters} 
                size="sm" 
                className={`w-full ${activeFiltersCount > 0 ? 'bg-derviche/10 text-derviche hover:bg-derviche/20 border border-derviche/30' : ''}`}
              >
                Réinitialiser
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-derviche text-white text-xs px-1.5 py-0">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {isLoading || columnsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-derviche" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={() => void loadReservations()}>Réessayer</Button>
        </div>
      ) : reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune réservation trouvée</p>
          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={handleResetFilters} className="mt-4">
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Vue Cards (mobile) */}
          <div className="space-y-3 lg:hidden">
            {reservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                visibleColumns={columns}
                onCheckin={openCheckinDialog}
                onEdit={openEditDialog}
                onCancel={openCancelDialog}
              />
            ))}
          </div>

          {/* Vue Tableau (desktop) */}
          <div className="hidden lg:block w-full">
            <Card className="py-0">
              <CardContent className="p-0">
                <div className="max-h-[70vh] overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b bg-muted/80 border-b-2 border-border sticky top-0 z-10 shadow-sm">
                      <tr className="border-b transition-colors">
                        <th className="h-10 px-2 w-10"></th>
                        {columns.map((col) => (
                          <SortableHeader
                            key={col}
                            column={col}
                            label={COLUMN_HEADERS[col]}
                            currentSort={filters.sortBy as SortOption | undefined}
                            onSort={handleSortChange}
                            className={col === 'numPlaces' ? 'text-center' : ''}
                          />
                        ))}
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {reservations.map((r, index) => (
                        <tr 
                          key={r.id} 
                          className={`border-b transition-colors cursor-pointer hover:bg-muted/70 ${r.status === 'cancelled' ? 'opacity-60' : ''} ${index % 2 === 1 ? 'bg-muted/50' : ''}`}
                          onClick={() => openEditDialog(r)}
                        >
                          <td className="p-2 align-middle">
                            <RowHoverActions
                              reservation={r}
                              onEdit={() => openEditDialog(r)}
                              onCheckin={() => openCheckinDialog(r)}
                              onCancel={() => openCancelDialog(r)}
                            />
                          </td>
                          {columns.map((col) => (
                            <td key={col} className="p-2 align-middle whitespace-nowrap">
                              {renderTableCell(col, r)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
            <p className="text-sm text-muted-foreground">
              Page {page}/{totalPages || 1}
              <span className="hidden sm:inline"> ({total} résultats)</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Afficher</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Précédent</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                    <span className="hidden sm:inline mr-1">Suivant</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Dialog Check-in */}
      <Dialog open={checkinDialogOpen} onOpenChange={setCheckinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check-in</DialogTitle>
            <DialogDescription>
              {selectedReservation && (
                <span className="block mt-1">
                  <strong>{selectedReservation.firstName} {selectedReservation.lastName}</strong>
                  <br />{selectedReservation.numPlaces} place{selectedReservation.numPlaces > 1 ? 's' : ''}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-pink-50 hover:border-pink-300" onClick={() => void handleCheckin('present_loved')} disabled={isProcessing}>
              <Heart className="w-8 h-8 text-pink-500" />
              <span className="text-sm">A aimé</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-blue-50 hover:border-blue-300" onClick={() => void handleCheckin('present_press')} disabled={isProcessing}>
              <Newspaper className="w-8 h-8 text-blue-500" />
              <span className="text-sm">Presse</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-gray-50 hover:border-gray-300" onClick={() => void handleCheckin('present_neutral')} disabled={isProcessing}>
              <Meh className="w-8 h-8 text-gray-500" />
              <span className="text-sm">Neutre</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-red-50 hover:border-red-300" onClick={() => void handleCheckin('absent')} disabled={isProcessing}>
              <XCircle className="w-8 h-8 text-red-500" />
              <span className="text-sm">Absent</span>
            </Button>
          </div>
          {isProcessing && <div className="flex justify-center pb-2"><Loader2 className="w-6 h-6 animate-spin" /></div>}
        </DialogContent>
      </Dialog>

      {/* Dialog Annulation */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Annuler la réservation</DialogTitle>
            <DialogDescription>
              {selectedReservation && (
                <span className="block mt-1">
                  Réservation de <strong>{selectedReservation.firstName} {selectedReservation.lastName}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-sm">Motif (optionnel)</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Raison de l'annulation..."
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isProcessing} className="w-full sm:w-auto">
              Retour
            </Button>
            <Button variant="destructive" onClick={() => void handleCancel()} disabled={isProcessing} className="w-full sm:w-auto">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Sélecteur de colonnes */}
      <ColumnSelectorDialog
        open={columnsDialogOpen}
        onOpenChange={setColumnsDialogOpen}
        preference={columnsPreference}
        onSave={handleSaveColumns}
        isSaving={isProcessing}
      />

      {/* Dialog Modification */}
      <EditReservationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        reservation={selectedReservation}
        onSave={handleEdit}
        onCancel={openCancelDialog}
        onGetSlots={getSlots}
        isSaving={isProcessing}
      />

      {/* Dialog Création */}
      <CreateReservationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        shows={shows}
        onGetSlots={getSlots}
        onCreate={handleCreate}
      />

      {/* Dialog Export */}
      <ExportDialog
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
