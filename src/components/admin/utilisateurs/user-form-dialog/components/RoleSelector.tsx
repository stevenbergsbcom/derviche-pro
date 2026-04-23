/**
 * Composant RoleSelector - Sélection du rôle utilisateur
 * Derviche Diffusion - Session 102
 */

'use client';

import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { translateRole } from '@/lib/services/internal-users';
import type { RoleSelectorProps } from '../types';
import { MANAGED_ROLES } from '../constants';
import { getRoleDescription, isValidRole } from '../utils';

/**
 * Sélecteur de rôle avec description
 */
export function RoleSelector({
  role,
  onChange,
  disabled,
  warningMessage,
  viewerRole,
}: RoleSelectorProps) {
  // Masquer l'option `super-admin` si le viewer n'est pas lui-même super-admin.
  // Défense côté UI ; le serveur re-valide dans /api/admin/users[POST|PATCH].
  const availableRoles = MANAGED_ROLES.filter((r) => {
    if (r === 'super-admin' && viewerRole !== 'super-admin') return false;
    return true;
  });

  return (
    <div className="space-y-2">
      <Label htmlFor="role">
        Rôle <span className="text-destructive">*</span>
      </Label>
      <Select
        value={role}
        onValueChange={(value) => {
          if (isValidRole(value)) {
            onChange(value);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id="role" aria-label="Choisir un rôle">
          <SelectValue placeholder="Sélectionner un rôle" />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((r) => (
            <SelectItem key={r} value={r}>
              {r === 'company' && <Building2 className="w-3 h-3 inline mr-1" />}
              {translateRole(r)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{getRoleDescription(role)}</p>
      {warningMessage && (
        <p className="text-xs text-amber-600">{warningMessage}</p>
      )}
    </div>
  );
}
