/**
 * Tableau d'historique des réservations du professionnel
 * Affiche spectacle, date, statut réservation et statut check-in
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CalendarDays, Loader2, RefreshCw } from 'lucide-react';
import type { ProfessionalReservationHistoryEntry } from '@/app/api/admin/professionals/[professionalId]/history/route';
import {
  RESERVATION_STATUS_CONFIG,
  CHECKIN_STATUS_CONFIG,
} from '@/lib/constants/reservation-statuses';
import { formatDate, formatTime } from './utils';

interface ReservationHistoryTableProps {
  /** Liste des entrées d'historique */
  history: ProfessionalReservationHistoryEntry[];
  /** Indique si le chargement est en cours */
  isLoading: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
  /** Callback pour recharger l'historique */
  onRefresh: () => void;
}

/** Tableau d'historique des réservations avec états de chargement et d'erreur */
export function ReservationHistoryTable({
  history,
  isLoading,
  error,
  onRefresh,
}: ReservationHistoryTableProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          Historique des réservations
        </h2>
        {!isLoading && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRefresh}
            aria-label="Actualiser"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Chargement */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Chargement de l&apos;historique&hellip;</span>
        </div>
      )}

      {/* Erreur */}
      {!isLoading && error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div className="space-y-2">
            <p className="text-sm text-red-700">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-7 px-2 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {/* Vide */}
      {!isLoading && !error && history.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucune réservation enregistrée
        </p>
      )}

      {/* Tableau */}
      {!isLoading && !error && history.length > 0 && (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Spectacle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut résa</TableHead>
                <TableHead>Checkin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => {
                const resaConfig = RESERVATION_STATUS_CONFIG[entry.reservation_status];
                const checkinConfig = entry.checkin_status
                  ? CHECKIN_STATUS_CONFIG[entry.checkin_status]
                  : null;

                return (
                  <TableRow
                    key={entry.reservation_id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    {/* Spectacle */}
                    <TableCell className="text-sm font-medium">
                      {entry.show_title}
                    </TableCell>

                    {/* Date + heure */}
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(entry.slot_date)}
                      <span className="ml-1 text-xs">{formatTime(entry.slot_time)}</span>
                    </TableCell>

                    {/* Statut réservation */}
                    <TableCell>
                      <Badge
                        className={`h-4 px-1.5 py-0 text-[10px] ${resaConfig.className}`}
                        variant="outline"
                      >
                        {resaConfig.label}
                      </Badge>
                    </TableCell>

                    {/* Statut checkin */}
                    <TableCell>
                      {checkinConfig ? (
                        <Badge
                          className={`h-4 px-1.5 py-0 text-[10px] ${checkinConfig.className}`}
                          variant="outline"
                        >
                          {checkinConfig.label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">&mdash;</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
