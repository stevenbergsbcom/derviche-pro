/**
 * Section gestion (responsable Derviche)
 * Derviche Diffusion - Session 101
 */

'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ManagementSectionProps } from '../types';

export function ManagementSection({
  dervisheManagerId,
  dervisheUsers,
  onDervisheManagerChange,
}: ManagementSectionProps) {
  // Filtrer les utilisateurs admin et super-admin
  const eligibleUsers = dervisheUsers.filter(
    (user) => user.role === 'super-admin' || user.role === 'admin'
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="dervisheManagerId">Responsable Derviche</Label>
      <Select
        value={dervisheManagerId || 'none'}
        onValueChange={(value) => {
          const actualValue = value === 'none' ? '' : value;
          onDervisheManagerChange(actualValue);
        }}
      >
        <SelectTrigger id="dervisheManagerId" aria-label="Choisir un responsable">
          <SelectValue placeholder="Sélectionner un responsable" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Aucun responsable</SelectItem>
          {eligibleUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
              <span className="text-xs text-muted-foreground ml-2">
                ({user.role === 'super-admin' ? 'Super Admin' : 'Admin'})
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Personne responsable du suivi de ce spectacle chez Derviche Diffusion
      </p>
    </div>
  );
}
