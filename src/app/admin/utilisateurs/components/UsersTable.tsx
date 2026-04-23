/**
 * Composant UsersTable - Tableau desktop des utilisateurs
 * Derviche Diffusion
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil, Trash2, Eye, Shield, Power, Building2 } from 'lucide-react';

import type { UsersTableProps } from '../types';
import { getRoleBadgeClass, isUserDisabled, isCurrentUser } from '../helpers';
import { MESSAGES, LABELS, TABLE_COLUMNS, ROLE_LABELS } from '../constants';

export function UsersTable({
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
  canEdit,
  canToggleStatus,
}: UsersTableProps) {

  return (
    <div className="hidden lg:block rounded-md border bg-white overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{TABLE_COLUMNS.NAME}</TableHead>
            <TableHead>{TABLE_COLUMNS.EMAIL}</TableHead>
            <TableHead>{TABLE_COLUMNS.ROLE}</TableHead>
            <TableHead>{TABLE_COLUMNS.COMPANY}</TableHead>
            <TableHead className="text-right">{TABLE_COLUMNS.ACTIONS}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                {hasFilters ? MESSAGES.NO_RESULTS : MESSAGES.NO_USERS}
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const isCurrent = isCurrentUser(user, currentUserId);
              const isDisabled = isUserDisabled(user);
              const userCanDelete = canDelete(user);
              const userCanEdit = canEdit(user);
              const userCanToggle = canToggleStatus(user);
              // Un admin (non super-admin) voit les super-admins mais ne
              // peut rien leur faire → tooltip partagé pour expliquer.
              const isProtectedSuperAdmin =
                user.role === 'super-admin' && currentUserRole !== 'super-admin';

              return (
                <TableRow key={user.id} className={isDisabled ? 'opacity-60' : ''}>
                  {/* Nom */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onView(user)}
                        className="cursor-pointer hover:text-derviche hover:underline text-left"
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
                  </TableCell>

                  {/* Email */}
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>

                  {/* Rôle */}
                  <TableCell>
                    <Badge className={getRoleBadgeClass(user.role)}>
                      {user.role === 'company' ? (
                        <Building2 className="w-3 h-3 mr-1" aria-hidden="true" />
                      ) : (
                        <Shield className="w-3 h-3 mr-1" aria-hidden="true" />
                      )}
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>

                  {/* Compagnie */}
                  <TableCell>
                    {user.company_name ? (
                      <span className="text-sm">{user.company_name}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Voir */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onView(user)}
                        aria-label={`${LABELS.VIEW} ${formatName(user)}`}
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </Button>

                      {/* Modifier */}
                      {userCanEdit ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(user)}
                          aria-label={`${LABELS.EDIT} ${formatName(user)}`}
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-not-allowed opacity-50"
                                disabled
                                aria-label={LABELS.EDIT}
                              >
                                <Pencil className="w-4 h-4" aria-hidden="true" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isProtectedSuperAdmin
                              ? 'Seul un super-administrateur peut modifier un compte super-admin.'
                              : MESSAGES.ACTION_NOT_ALLOWED}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Toggle Status - visible uniquement pour Super Admin */}
                      {currentUserRole === 'super-admin' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${
                                  isDisabled 
                                    ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                                    : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                                }`}
                                onClick={() => void onToggleStatus(user)}
                                disabled={!userCanToggle || isSubmitting}
                                aria-label={isDisabled ? LABELS.ACTIVATE : LABELS.DEACTIVATE}
                              >
                                <Power className="w-4 h-4" aria-hidden="true" />
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
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(user)}
                          aria-label={`${LABELS.DELETE} ${formatName(user)}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive/50 cursor-not-allowed"
                                disabled
                                aria-label={LABELS.DELETE}
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isProtectedSuperAdmin
                              ? 'Seul un super-administrateur peut supprimer un compte super-admin.'
                              : MESSAGES.SELF_DELETE_ERROR}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
