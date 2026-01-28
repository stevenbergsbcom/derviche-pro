/**
 * Composant CompanySelector - Sélection de la compagnie
 * Derviche Diffusion - Session 102
 */

'use client';

import { Label } from '@/components/ui/label';
import { Building2, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CompanySelectorProps } from '../types';
import { HELP_MESSAGES } from '../constants';

/**
 * Sélecteur de compagnie pour les utilisateurs de type company
 */
export function CompanySelector({
  companyId,
  companies,
  onChange,
  isLoading,
  disabled,
  validationError,
  isCreating,
  isEditingCompanyUser,
}: CompanySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="company_id">
        Compagnie associée <span className="text-destructive">*</span>
      </Label>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement des compagnies...
        </div>
      ) : (
        <Select
          value={companyId || ''}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger
            id="company_id"
            className={validationError ? 'border-destructive' : ''}
            aria-label="Choisir une compagnie"
          >
            <SelectValue placeholder="Sélectionner une compagnie" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  {company.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {validationError && (
        <p className="text-sm text-destructive">{validationError}</p>
      )}

      {!isCreating && isEditingCompanyUser && (
        <p className="text-xs text-muted-foreground">
          {HELP_MESSAGES.companyCannotChange}
        </p>
      )}

      {!isCreating && !isEditingCompanyUser && (
        <p className="text-xs text-amber-600">
          {HELP_MESSAGES.companyChangeWarning}
        </p>
      )}
    </div>
  );
}
