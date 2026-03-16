/**
 * En-tête de la fiche professionnel
 * Affiche avatar, nom, structure, badge actif/inactif et statistiques
 */

'use client';

import { Badge } from '@/components/ui/badge';
import type { Professional } from '@/lib/services/professionals';
import type { ProfessionalReservationHistoryEntry } from '@/app/api/admin/professionals/[professionalId]/history/route';
import { ProfessionalAvatar } from './professional-avatar';
import { formatDate } from './utils';

interface ProfileHeaderProps {
  /** Données du professionnel */
  professional: Professional;
  /** Nom complet (prénom + nom) */
  displayName: string;
  /** Nom complet sans fallback email */
  fullName: string;
  /** Indique si le compte est actif */
  isActive: boolean;
  /** Historique des réservations (pour les stats) */
  history: ProfessionalReservationHistoryEntry[];
}

/** En-tête de la fiche avec avatar, identité et statistiques résumées */
export function ProfileHeader({
  professional,
  displayName,
  fullName,
  isActive,
  history,
}: ProfileHeaderProps) {
  const totalConfirmed = history.filter((r) => r.reservation_status === 'confirmed').length;
  const totalPresent = history.filter(
    (r) =>
      r.checkin_status === 'present_neutral' ||
      r.checkin_status === 'present_loved' ||
      r.checkin_status === 'present_press'
  ).length;

  return (
    <div className="flex items-start gap-4 rounded-xl border bg-card p-6">
      <ProfessionalAvatar name={displayName} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold leading-tight">{displayName}</h1>
            {fullName && (
              <p className="mt-0.5 text-sm text-muted-foreground">{professional.email}</p>
            )}
            {professional.structure && (
              <p className="text-sm text-muted-foreground">{professional.structure}</p>
            )}
          </div>
          <Badge
            className={`mt-1 text-xs ${
              isActive
                ? 'border-green-200 bg-green-100 text-green-800'
                : 'border-red-200 bg-red-100 text-red-800'
            }`}
            variant="outline"
          >
            {isActive ? 'Actif' : 'Inactif'}
          </Badge>
        </div>

        {/* Petites stats */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">{history.length}</strong> r&eacute;servation
            {history.length > 1 ? 's' : ''}
          </span>
          <span className="text-muted-foreground/40">&middot;</span>
          <span>
            <strong className="text-foreground">{totalConfirmed}</strong> confirm&eacute;e
            {totalConfirmed > 1 ? 's' : ''}
          </span>
          {totalPresent > 0 && (
            <>
              <span className="text-muted-foreground/40">&middot;</span>
              <span>
                <strong className="text-foreground">{totalPresent}</strong> pr&eacute;sence
                {totalPresent > 1 ? 's' : ''} valid&eacute;e{totalPresent > 1 ? 's' : ''}
              </span>
            </>
          )}
          {professional.created_at && (
            <>
              <span className="text-muted-foreground/40">&middot;</span>
              <span>Inscrit le {formatDate(professional.created_at)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
