/**
 * Composant UsersMobileCards - Cartes mobile des utilisateurs
 * Derviche Diffusion
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil, Trash2, Eye, Shield, Power, Building2 } from 'lucide-react';

import type { UsersMobileCardsProps } from '../types';
import { getRoleBadgeClass, isUserDisabled, isCurrentUser } from '../helpers';
import { MESSAGES, LABELS, ROLE_LABELS } from '../constants';

export function UsersMobileCards({
  users,
  currentUserId,
  currentUserRole,
  isSubmitting,
  hasFilters,
  formatName,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  canDelete,
  canToggleStatus,
}: UsersMobileCardsProps) {

  if (users.length === 0) {
    return (
      <div className="lg:hidden">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {hasFilters ? MESSAGES.NO_RESULTS : MESSAGES.NO_USERS}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="lg:hidden space-y-4">
      {users.map((user) => {
        const isCurrent = isCurrentUser(user, currentUserId);
        const isDisabled = isUserDisabled(user);
        const userCanDelete = canDelete(user);
        const userCanToggle = canToggleStatus(user);

        return (
          <Card key={user.id} className={isDisabled ? 'opacity-60' : ''}>
            <CardContent className="p-4 space-y-3">
              {/* Header avec nom et badge rôle */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className="font-semibold cursor-pointer hover:text-derviche hover:underline text-left"
                      onClick={() => onView(user)}
                      aria-label={`${LABELS.VIEW} ${formatName(user)}`}
                    >
                      {formatName(user)}
                    </button>
                    {isCurrent && (
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-green-50 text-green-700 border-green-200"
                      >
                        {LABELS.YOU}
                      </Badge>
                    )}
                    {isDisabled && (
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-red-50 text-red-700 border-red-200"
                      >
                        {LABELS.INACTIVE}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.company_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Building2 className="w-3 h-3 inline mr-1" aria-hidden="true" />
                      {user.company_name}
                    </p>
                  )}
                </div>
                <Badge className={getRoleBadgeClass(user.role)}>
                  {user.role === 'company' ? (
                    <Building2 className="w-3 h-3 mr-1" aria-hidden="true" />
                  ) : (
                    <Shield className="w-3 h-3 mr-1" aria-hidden="true" />
                  )}
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                {/* Voir */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => onView(user)}
                  aria-label={`${LABELS.VIEW} ${formatName(user)}`}
                >
                  <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
                  {LABELS.VIEW}
                </Button>

                {/* Modifier */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(user)}
                  aria-label={`${LABELS.EDIT} ${formatName(user)}`}
                >
                  <Pencil className="w-4 h-4 mr-2" aria-hidden="true" />
                  {LABELS.EDIT}
                </Button>

                {/* Toggle Status - visible uniquement pour Super Admin */}
                {currentUserRole === 'super-admin' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`w-full ${
                            isDisabled 
                              ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                              : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                          }`}
                          onClick={() => void onToggleStatus(user)}
                          disabled={!userCanToggle || isSubmitting}
                          aria-label={isDisabled ? MESSAGES.ACTIVATE_ACCOUNT : MESSAGES.DEACTIVATE_ACCOUNT}
                        >
                          <Power className="w-4 h-4 mr-2" aria-hidden="true" />
                          {isDisabled ? LABELS.ACTIVATE : LABELS.DEACTIVATE}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!userCanToggle 
                        ? (user.role === 'super-admin' 
                            ? MESSAGES.SUPER_ADMIN_CANNOT_DISABLE 
                            : MESSAGES.ACTION_NOT_ALLOWED)
                        : isDisabled 
                            ? MESSAGES.ACTIVATE_ACCOUNT 
                            : MESSAGES.DEACTIVATE_ACCOUNT
                      }
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Supprimer */}
                {userCanDelete ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(user)}
                    aria-label={`${LABELS.DELETE} ${formatName(user)}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                    {LABELS.DELETE}
                  </Button>
                ) : (
                  <span className="flex-1" title={MESSAGES.SELF_DELETE_ERROR}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive/50 cursor-not-allowed"
                      disabled
                      aria-label={MESSAGES.SELF_DELETE_ERROR}
                    >
                      <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                      {LABELS.DELETE}
                    </Button>
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
