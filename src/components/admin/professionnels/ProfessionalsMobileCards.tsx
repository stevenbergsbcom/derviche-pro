/**
 * Composant ProfessionalsMobileCards - Vue mobile des professionnels
 * Derviche Diffusion
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Building2,
  MapPin,
  Phone,
} from 'lucide-react';
import { copyEmailWithToast } from '@/lib/utils/copy-email';
import { EmptyState } from '@/components/admin';
import type { ProfessionalsTableProps } from '@/app/admin/professionnels/types';
import {
  STATUS_BADGE_CLASSES,
  LABELS,
  MESSAGES,
} from '@/app/admin/professionnels/constants';

export function ProfessionalsMobileCards({
  professionals,
  hasFilters,
  isSubmitting,
  formatName,
  onView,
  onToggleStatus,
  onDelete,
}: ProfessionalsTableProps) {
  if (professionals.length === 0) {
    return (
      <div className="md:hidden">
        <EmptyState
          title={hasFilters ? MESSAGES.NO_RESULTS : MESSAGES.NO_PROFESSIONALS}
        />
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {professionals.map((pro) => {
        const isActive = pro.disabled_at === null;
        const statusClass = isActive
          ? STATUS_BADGE_CLASSES.active
          : STATUS_BADGE_CLASSES.inactive;
        const statusLabel = isActive ? LABELS.ACTIVE : LABELS.INACTIVE;

        return (
          <div
            key={pro.id}
            className="border rounded-lg p-4 space-y-3 bg-card cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => onView(pro)}
          >
            {/* En-tête : nom + statut + actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{formatName(pro) || LABELS.NO_DATA}</p>
                <Badge
                  className={`text-xs mt-1 ${statusClass}`}
                  variant="outline"
                >
                  {statusLabel}
                </Badge>
              </div>

              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onView(pro)}
                  aria-label={LABELS.VIEW_DETAIL}
                >
                  <Eye className="h-4 w-4" />
                </Button>

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
                    <DropdownMenuItem asChild>
                      <a
                        href={`mailto:${pro.email}`}
                        onClick={() => void copyEmailWithToast(pro.email)}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        {LABELS.EMAIL_CONTACT}
                      </a>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

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
            </div>

            {/* Détails */}
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <p className="truncate">{pro.email}</p>

              {pro.structure && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{pro.structure}</span>
                </div>
              )}

              {pro.city && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{pro.city}</span>
                </div>
              )}

              {pro.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{pro.phone}</span>
                </div>
              )}
            </div>

            {/* Réservations */}
            {pro.reservation_count > 0 && (
              <p className="text-xs font-medium text-derviche">
                {pro.reservation_count} réservation{pro.reservation_count > 1 ? 's' : ''}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
