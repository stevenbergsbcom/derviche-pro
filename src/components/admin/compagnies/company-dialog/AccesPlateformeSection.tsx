/**
 * Sous-composant : onglet accès plateforme
 * Extrait de company-dialog.tsx — S160
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Theater,
  ArrowRight,
  Globe,
  KeyRound,
  UserPlus,
  User,
  CheckCircle,
  XCircle,
  UserMinus,
  RefreshCw,
  Mail,
  Phone,
} from 'lucide-react';
import type { AccesPlateformeSectionProps } from './types';

export function AccesPlateformeSection({
  company,
  showsCount,
  onViewShows,
  companyUser,
  isLoadingUser,
  onCreateUser,
  onAssignUser,
  onChangeUser,
  onUnlinkUser,
  isProcessing,
}: AccesPlateformeSectionProps) {
  return (
    <div className="space-y-6 py-4 px-1">
      {/* Spectacles liés */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Spectacles</h4>
        <div className="flex items-center gap-2">
          <Badge
            className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
            onClick={onViewShows}
          >
            <Theater className="w-3 h-3 mr-1" />
            {showsCount} spectacle{showsCount > 1 ? 's' : ''}
          </Badge>
          {showsCount > 0 && onViewShows && (
            <Button
              variant="ghost"
              size="sm"
              className="text-derviche hover:text-derviche"
              onClick={onViewShows}
            >
              Voir les spectacles
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Accès utilisateur plateforme */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <KeyRound className="w-4 h-4" />
          Compte utilisateur
        </h4>

        {isLoadingUser ? (
          <p className="text-sm text-muted-foreground animate-pulse">Chargement...</p>
        ) : companyUser ? (
          /* Utilisateur existant */
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Compte actif</span>
              {companyUser.disabled_at && (
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-300 text-xs"
                >
                  Désactivé
                </Badge>
              )}
            </div>
            <div className="space-y-1 text-sm">
              {(companyUser.first_name || companyUser.last_name) && (
                <p className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  {[companyUser.first_name, companyUser.last_name].filter(Boolean).join(' ')}
                </p>
              )}
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-green-700">{companyUser.email}</span>
              </p>
              {companyUser.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  {companyUser.phone}
                </p>
              )}
            </div>

            {(onChangeUser || onUnlinkUser) && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-green-200">
                {onChangeUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onChangeUser}
                    disabled={isProcessing}
                    className="flex-1 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Changer
                  </Button>
                )}
                {onUnlinkUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUnlinkUser}
                    disabled={isProcessing}
                    className="flex-1 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                  >
                    <UserMinus className="w-3.5 h-3.5 mr-1.5" />
                    Dissocier
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Pas d'utilisateur */
          <div className="p-3 bg-muted/50 border border-dashed rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Aucun accès configuré</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              {onCreateUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateUser}
                  className="flex-1"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer un accès
                </Button>
              )}
              {onAssignUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAssignUser}
                  className="flex-1"
                >
                  <User className="w-4 h-4 mr-2" />
                  Assigner un existant
                </Button>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          Cet accès permet à la compagnie de consulter ses réservations sur la plateforme.
        </p>
      </div>

      {/* Infos contact métier (lecture seule) */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-1">Contact métier</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Contact pour l&apos;organisation des spectacles (différent du compte plateforme).
          Modifiable dans l&apos;onglet Informations.
        </p>
        <div className="space-y-2">
          {company.contact_name && (
            <p className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              {company.contact_name}
            </p>
          )}
          {company.contact_email && (
            <p className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a
                href={`mailto:${company.contact_email}`}
                className="text-derviche hover:underline"
              >
                {company.contact_email}
              </a>
            </p>
          )}
          {company.contact_phone && (
            <p className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a
                href={`tel:${company.contact_phone}`}
                className="text-derviche hover:underline"
              >
                {company.contact_phone}
              </a>
            </p>
          )}
          {company.website && (
            <p className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-derviche hover:underline"
              >
                {company.website}
              </a>
            </p>
          )}
          {!company.contact_name && !company.contact_email && !company.contact_phone && (
            <span className="text-sm text-muted-foreground italic">
              Aucun contact renseigné
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
