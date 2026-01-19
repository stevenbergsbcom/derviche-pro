'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Eye,
  CheckSquare,
  Square,
  LayoutGrid,
  Calendar,
  CalendarCheck,
  CalendarX,
  ListFilter,
} from 'lucide-react';
import {
  RESERVATION_COLUMNS_CONFIG,
  DEFAULT_COLUMNS_ORDER,
  type ReservationColumn,
} from '@/hooks/useUserPreferences';
import type { AdminReservation, AdminReservationFilters } from '@/lib/services/admin-reservations';

// ============================================
// TYPES
// ============================================

export type ExportFormat = 'csv' | 'xlsx';
export type ExportPeriod = 'all' | 'upcoming' | 'past';

export interface ExportOptions {
  format: ExportFormat;
  columns: ReservationColumn[];
  period: ExportPeriod;
}

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservations: AdminReservation[];
  filters: AdminReservationFilters;
  visibleColumns: ReservationColumn[];
  onExport: (options: ExportOptions) => Promise<{ success: boolean; error?: string }>;
  isExporting: boolean;
}

// ============================================
// HELPERS
// ============================================

/** Génère un nom de fichier intelligent basé sur les filtres */
export function generateExportFilename(
  filters: AdminReservationFilters,
  format: ExportFormat,
  period: ExportPeriod,
  showTitle?: string
): string {
  const date = new Date().toISOString().split('T')[0];
  const parts: string[] = ['reservations'];

  // Ajouter le contexte des filtres
  if (showTitle) {
    // Nettoyer le titre pour le nom de fichier
    const cleanTitle = showTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer caractères spéciaux par tirets
      .replace(/^-+|-+$/g, '') // Enlever tirets début/fin
      .substring(0, 30);
    parts.push(cleanTitle);
  }

  // Ajouter la période
  if (period === 'upcoming') {
    parts.push('a-venir');
  } else if (period === 'past') {
    parts.push('passees');
  } else {
    parts.push('toutes');
  }

  // Ajouter le statut si filtré
  if (filters.status) {
    parts.push(filters.status);
  }

  parts.push(date);

  return `${parts.join('_')}.${format}`;
}

/** Formate une date pour l'aperçu */
function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });
}

/** 
 * Obtient la valeur d'affichage d'une cellule pour l'aperçu.
 * Note: Les valeurs sont tronquées pour l'affichage dans le dialog.
 * L'export réel dans useAdminReservations.ts contient les valeurs complètes.
 */
function getCellValue(col: ReservationColumn, r: AdminReservation): string {
  switch (col) {
    case 'date':
      return r.slot?.date ? formatDateShort(r.slot.date) : '-';
    case 'spectacle':
      return r.slot?.show?.title?.substring(0, 25) || '-';
    case 'venue':
      return r.slot?.venue?.name?.substring(0, 20) || '-';
    case 'lastName':
      return r.lastName || '-';
    case 'firstName':
      return r.firstName || '-';
    case 'email':
      return r.email?.substring(0, 20) || '-';
    case 'phone':
      return r.phone || '-';
    case 'emailSecondary':
      return r.emailSecondary || '-';
    case 'phoneSecondary':
      return r.phoneSecondary || '-';
    case 'organization':
      return r.organization?.substring(0, 20) || '-';
    case 'function':
      return r.function || '-';
    case 'afcNumber':
      return r.afcNumber || '-';
    case 'address': {
      // Même format que l'export: adresse + CP + ville
      const parts = [r.address, r.postalCode, r.city].filter(Boolean);
      const fullAddress = parts.length > 0 ? parts.join(' ') : '-';
      return fullAddress.substring(0, 25) + (fullAddress.length > 25 ? '...' : '');
    }
    case 'numPlaces':
      return String(r.numPlaces);
    case 'status': {
      // Même format que l'export
      const statusMap: Record<string, string> = {
        confirmed: 'Confirmée',
        cancelled: 'Annulée',
        no_show: 'No-show',
      };
      return statusMap[r.status] || r.status;
    }
    case 'checkinStatus': {
      if (!r.checkinStatus) return '-';
      // Même format que l'export (texte, pas emojis)
      const checkinMap: Record<string, string> = {
        present_loved: 'A aimé',
        present_press: 'Presse',
        present_neutral: 'Neutre',
        absent: 'Absent',
      };
      return checkinMap[r.checkinStatus] || r.checkinStatus;
    }
    case 'specialRequests':
      return r.specialRequests?.substring(0, 15) || '-';
    case 'checkinNotes':
      return r.checkinComment?.substring(0, 15) || '-';
    case 'checkinVenueNotes':
      return r.checkinVenueNotes?.substring(0, 15) || '-';
    case 'checkinInternalNotes':
      return r.checkinInternalNotes?.substring(0, 15) || '-';
    case 'createdAt':
      return r.createdAt ? formatDateShort(r.createdAt.split('T')[0]) : '-';
    default:
      return '-';
  }
}

// ============================================
// CONSTANTES
// ============================================

const PERIOD_OPTIONS: { value: ExportPeriod; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'all',
    label: 'Toutes',
    icon: <Calendar className="w-5 h-5" />,
    description: 'Exporter toutes les réservations',
  },
  {
    value: 'upcoming',
    label: 'À venir',
    icon: <CalendarCheck className="w-5 h-5" />,
    description: 'Représentations futures uniquement',
  },
  {
    value: 'past',
    label: 'Passées',
    icon: <CalendarX className="w-5 h-5" />,
    description: 'Représentations passées uniquement',
  },
];

// ============================================
// COMPOSANT
// ============================================

export function ExportDialog({
  open,
  onOpenChange,
  reservations,
  filters,
  visibleColumns,
  onExport,
  isExporting,
}: ExportDialogProps) {
  // État local
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  // Initialiser avec la période de la page si elle existe
  const [period, setPeriod] = useState<ExportPeriod>(
    filters.period === 'upcoming' ? 'upcoming' : 
    filters.period === 'past' ? 'past' : 'all'
  );
  const [selectedColumns, setSelectedColumns] = useState<ReservationColumn[]>(visibleColumns);

  // Reset quand le dialog s'ouvre
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedColumns(visibleColumns);
      setFormat('xlsx');
      // Réinitialiser avec la période de la page
      setPeriod(
        filters.period === 'upcoming' ? 'upcoming' : 
        filters.period === 'past' ? 'past' : 'all'
      );
    }
    onOpenChange(newOpen);
  };

  // Toggle une colonne
  const toggleColumn = (col: ReservationColumn) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  // Sélectionner toutes les colonnes
  const selectAll = () => {
    setSelectedColumns([...DEFAULT_COLUMNS_ORDER]);
  };

  // Désélectionner toutes les colonnes
  const deselectAll = () => {
    setSelectedColumns([]);
  };

  // Utiliser les colonnes visibles du tableau
  const useTableColumns = () => {
    setSelectedColumns(visibleColumns);
  };

  // Aperçu des données (5 premières lignes max)
  const previewData = useMemo(() => {
    return reservations.slice(0, 5);
  }, [reservations]);

  // Colonnes sélectionnées dans l'ordre
  const orderedSelectedColumns = useMemo(() => {
    return DEFAULT_COLUMNS_ORDER.filter((col) => selectedColumns.includes(col));
  }, [selectedColumns]);

  // Nom de fichier prévu (sans titre spectacle car on n'a que les données paginées)
  // Le vrai nom avec le titre sera généré dans le hook lors de l'export
  const filename = useMemo(() => {
    return generateExportFilename(filters, format, period, undefined);
  }, [filters, format, period]);

  // Déterminer si des filtres de la page sont actifs
  const hasActivePageFilters = !!(filters.showId || filters.status || filters.search || filters.dateFrom || filters.dateTo || filters.period);

  // Handler export
  const handleExport = async () => {
    const result = await onExport({ format, columns: orderedSelectedColumns, period });
    if (result.success) {
      onOpenChange(false);
    }
  };

  const canExport = selectedColumns.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exporter les réservations
          </DialogTitle>
          <DialogDescription>
            Configurez les options d&apos;export ci-dessous
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Avertissement filtres de la page */}
          {hasActivePageFilters && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <ListFilter className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Filtres de la page actifs</p>
                <p className="text-amber-700 text-xs mt-0.5">
                  L&apos;export respectera les filtres appliqués sur la page (spectacle, statut, recherche, dates).
                </p>
              </div>
            </div>
          )}

          {/* Sélection de la période */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Période à exporter</Label>
            <div className="grid grid-cols-3 gap-2">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors ${
                    period === option.value
                      ? 'border-derviche bg-derviche/5'
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <span className={period === option.value ? 'text-derviche' : 'text-muted-foreground'}>
                    {option.icon}
                  </span>
                  <span className="font-medium text-sm">{option.label}</span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight hidden sm:block">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Format d'export */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format d&apos;export</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                  format === 'xlsx'
                    ? 'border-derviche bg-derviche/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <FileSpreadsheet className={`w-8 h-8 ${format === 'xlsx' ? 'text-derviche' : 'text-green-600'}`} />
                <div className="text-left">
                  <div className="font-medium">Excel (.xlsx)</div>
                  <div className="text-xs text-muted-foreground">Recommandé pour l&apos;analyse</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                  format === 'csv'
                    ? 'border-derviche bg-derviche/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <FileText className={`w-8 h-8 ${format === 'csv' ? 'text-derviche' : 'text-blue-600'}`} />
                <div className="text-left">
                  <div className="font-medium">CSV (.csv)</div>
                  <div className="text-xs text-muted-foreground">Compatible avec tout logiciel</div>
                </div>
              </button>
            </div>
          </div>

          {/* Sélection des colonnes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Colonnes à exporter
                <Badge variant="secondary" className="ml-2">
                  {selectedColumns.length}/{DEFAULT_COLUMNS_ORDER.length}
                </Badge>
              </Label>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs">
                  <CheckSquare className="w-3 h-3 mr-1" />
                  Tout
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={deselectAll} className="h-7 text-xs">
                  <Square className="w-3 h-3 mr-1" />
                  Aucun
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={useTableColumns} className="h-7 text-xs">
                  <LayoutGrid className="w-3 h-3 mr-1" />
                  Tableau
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto p-1">
              {DEFAULT_COLUMNS_ORDER.map((col) => (
                <label
                  key={col}
                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-sm ${
                    selectedColumns.includes(col)
                      ? 'bg-derviche/10 border border-derviche/30'
                      : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  <Checkbox
                    checked={selectedColumns.includes(col)}
                    onCheckedChange={() => toggleColumn(col)}
                  />
                  <span className="truncate">{RESERVATION_COLUMNS_CONFIG[col].label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Aperçu */}
          {previewData.length > 0 && orderedSelectedColumns.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Aperçu (5 premières lignes de la page actuelle)
              </Label>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-muted/80">
                    <tr>
                      {orderedSelectedColumns.slice(0, 6).map((col) => (
                        <th key={col} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">
                          {RESERVATION_COLUMNS_CONFIG[col].label}
                        </th>
                      ))}
                      {orderedSelectedColumns.length > 6 && (
                        <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                          +{orderedSelectedColumns.length - 6}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((r, idx) => (
                      <tr key={r.id} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                        {orderedSelectedColumns.slice(0, 6).map((col) => (
                          <td key={col} className="px-2 py-1.5 whitespace-nowrap">
                            {getCellValue(col, r)}
                          </td>
                        ))}
                        {orderedSelectedColumns.length > 6 && (
                          <td className="px-2 py-1.5 text-muted-foreground">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Nom du fichier prévu */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
            {format === 'xlsx' ? (
              <FileSpreadsheet className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <span className="font-mono text-xs truncate">{filename}</span>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            disabled={!canExport || isExporting}
            className="w-full sm:w-auto bg-derviche hover:bg-derviche/90"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Télécharger ({format.toUpperCase()})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
