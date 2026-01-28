/**
 * Composant MustChangePasswordField - Case forcer changement mot de passe
 * Derviche Diffusion - Session 102
 */

'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { MustChangePasswordFieldProps } from '../types';

/**
 * Case à cocher pour forcer le changement de mot de passe à la première connexion
 */
export function MustChangePasswordField({
  checked,
  onChange,
  isSubmitting,
}: MustChangePasswordFieldProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="must_change_password"
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        disabled={isSubmitting}
      />
      <Label
        htmlFor="must_change_password"
        className="text-sm font-normal cursor-pointer"
      >
        Forcer le changement de mot de passe à la première connexion
      </Label>
    </div>
  );
}
