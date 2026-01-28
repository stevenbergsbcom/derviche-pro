/**
 * Composant EmailField - Champ email création/édition
 * Derviche Diffusion - Session 102
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EmailFieldProps } from '../types';
import { HELP_MESSAGES } from '../constants';

/**
 * Champ email avec comportement différent selon le mode
 * - Création : champ éditable avec validation
 * - Édition : champ en lecture seule
 */
export function EmailField({
  isCreating,
  email,
  editingUserEmail,
  onChange,
  validationError,
  isSubmitting,
}: EmailFieldProps) {
  if (isCreating) {
    return (
      <div className="space-y-2">
        <Label htmlFor="new_user_email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="new_user_email"
          name="new_user_email_field"
          type="email"
          value={email}
          onChange={(e) => onChange(e.target.value)}
          placeholder="utilisateur@exemple.fr"
          disabled={isSubmitting}
          className={validationError ? 'border-destructive' : ''}
          autoComplete="off"
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
        />
        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}
      </div>
    );
  }

  // Mode édition - lecture seule
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        value={editingUserEmail || ''}
        disabled
        className="bg-muted"
      />
      <p className="text-xs text-muted-foreground">
        {HELP_MESSAGES.emailReadOnly}
      </p>
    </div>
  );
}
