/**
 * Composant ProfessionalsTable - Table principale des professionnels
 * Derviche Diffusion
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  MoreHorizontal,
  UserCheck,
  UserX,
  Trash2,
  Mail,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/admin';
import type { ProfessionalsTableProps } from '@/app/admin/professionnels/types';
import { STATUS_BADGE_CLASSES, TABLE_COLUMNS, LABELS, MESSAGES } from '@/app/admin/professionnels/constants';
import type { ProfessionalColumn } from '@/hooks/useUserPreferences';

interface ProfessionalsTableWithColumnsProps extends ProfessionalsTableProps {
  visibleColumns: ProfessionalColumn[];
}

export function ProfessionalsTable({
  professionals,
  hasFilters,
  isSubmitting,
  formatName,
  onView,
  onToggleStatus,
  onDelete,
  visibleColumns,
}: ProfessionalsTableWithColumnsProps) {
  const show = (col: ProfessionalColumn) => visibleColumns.includes(col);
  if (professionals.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? MESSAGES.NO_RESULTS : MESSAGES.NO_PROFESSIONALS}
      />
    );
  }

  return (
    <div className="hidden md:block rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>{TABLE_COLUMNS.NAME}</TableHead>
            <TableHead>{TABLE_COLUMNS.EMAIL}</TableHead>
            {show('structure')    && <TableHead>{TABLE_COLUMNS.STRUCTURE}</TableHead>}
            {show('phone')        && <TableHead>{TABLE_COLUMNS.PHONE}</TableHead>}
            {show('email2')       && <TableHead>{TABLE_COLUMNS.EMAIL2}</TableHead>}
            {show('phone2')       && <TableHead>{TABLE_COLUMNS.PHONE2}</TableHead>}
            {show('function')     && <TableHead>{TABLE_COLUMNS.FUNCTION}</TableHead>}
            {show('city')         && <TableHead>{TABLE_COLUMNS.CITY}</TableHead>}
            {show('reservations') && <TableHead className="text-center">{TABLE_COLUMNS.RESERVATIONS}</TableHead>}
            <TableHead>{TABLE_COLUMNS.STATUS}</TableHead>
            <TableHead className="text-right">{TABLE_COLUMNS.ACTIONS}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {professionals.map((pro) => {
            const isActive = pro.disabled_at === null;
            const statusClass = isActive
              ? STATUS_BADGE_CLASSES.active
              : STATUS_BADGE_CLASSES.inactive;
            const statusLabel = isActive ? LABELS.ACTIVE : LABELS.INACTIVE;

            return (
              <TableRow
                key={pro.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onView(pro)}
              >
                {/* Nom */}
                <TableCell className="font-medium">
                  {formatName(pro) || LABELS.NO_DATA}
                </TableCell>

                {/* Email principal */}
                <TableCell
                  className="text-sm text-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <a
                    href={`mailto:${pro.email}`}
                    className="hover:underline hover:text-foreground transition-colors"
                    title={LABELS.EMAIL_CONTACT}
                  >
                    {pro.email}
                  </a>
                </TableCell>

                {/* Structure */}
                {show('structure') && (
                  <TableCell className="text-sm">
                    {pro.structure ?? LABELS.NO_DATA}
                  </TableCell>
                )}

                {/* Téléphone */}
                {show('phone') && (
                  <TableCell className="text-sm">
                    {pro.phone ?? LABELS.NO_DATA}
                  </TableCell>
                )}

                {/* Email secondaire */}
                {show('email2') && (
                  <TableCell
                    className="text-sm text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {pro.email2 ? (
                      <a
                        href={`mailto:${pro.email2}`}
                        className="hover:underline hover:text-foreground transition-colors"
                      >
                        {pro.email2}
                      </a>
                    ) : (
                      LABELS.NO_DATA
                    )}
                  </TableCell>
                )}

                {/* Téléphone secondaire */}
                {show('phone2') && (
                  <TableCell className="text-sm">
                    {pro.phone2 ?? LABELS.NO_DATA}
                  </TableCell>
                )}

                {/* Fonction */}
                {show('function') && (
                  <TableCell className="text-sm">
                    {pro.function ?? LABELS.NO_DATA}
                  </TableCell>
                )}

                {/* Ville */}
                {show('city') && (
                  <TableCell className="text-sm">
                    {pro.city ?? LABELS.NO_DATA}
                  </TableCell>
                )}

                {/* Nb réservations */}
                {show('reservations') && (
                  <TableCell className="text-center">
                    <span
                      className={
                        pro.reservation_count > 0
                          ? 'font-semibold text-derviche'
                          : 'text-muted-foreground'
                      }
                    >
                      {pro.reservation_count}
                    </span>
                  </TableCell>
                )}

                {/* Statut */}
                <TableCell>
                  <Badge className={`text-xs ${statusClass}`} variant="outline">
                    {statusLabel}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    {/* Bouton Voir */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onView(pro)}
                          aria-label={LABELS.VIEW_DETAIL}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{LABELS.VIEW_DETAIL}</TooltipContent>
                    </Tooltip>

                    {/* Menu contextuel */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isSubmitting}
                          aria-label="Plus d'actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Fiche complète */}
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/professionnels/${pro.id}`}>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Voir la fiche complète
                          </Link>
                        </DropdownMenuItem>

                        {/* Mailto */}
                        <DropdownMenuItem asChild>
                          <a href={`mailto:${pro.email}`}>
                            <Mail className="mr-2 h-4 w-4" />
                            {LABELS.EMAIL_CONTACT}
                          </a>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Activer / Désactiver */}
                        <DropdownMenuItem
                          onClick={() => onToggleStatus(pro)}
                          className={isActive ? 'text-orange-600' : 'text-green-600'}
                        >
                          {isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              {LABELS.DEACTIVATE}
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              {LABELS.ACTIVATE}
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Supprimer */}
                        <DropdownMenuItem
                          onClick={() => onDelete(pro)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {LABELS.DELETE}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
