/**
 * OptionalLinkToggle — Toggle lien optionnel (DRY)
 * Derviche Diffusion - Admin Preferences
 *
 * Sous-composant réutilisable pour activer/désactiver un lien optionnel
 * dans un template email, avec champ texte personnalisable.
 */

'use client';

import type { UseFormRegister } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import type { TemplateFormValues } from './schema';

// ============================================
// PROPS
// ============================================

interface OptionalLinkToggleProps {
  templateKey: string;
  label: string;
  description: string;
  showFieldName: keyof TemplateFormValues;
  textFieldName: keyof TemplateFormValues;
  placeholder: string;
  isVisible: boolean;
  onToggle: (checked: boolean) => void;
  canEdit: boolean;
  registerFn: UseFormRegister<TemplateFormValues>;
}

// ============================================
// COMPOSANT
// ============================================

export function OptionalLinkToggle({
  templateKey,
  label,
  description,
  showFieldName,
  textFieldName,
  placeholder,
  isVisible,
  onToggle,
  canEdit,
  registerFn,
}: OptionalLinkToggleProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor={`${showFieldName}-${templateKey}`} className="text-sm font-medium">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch
          id={`${showFieldName}-${templateKey}`}
          checked={isVisible}
          onCheckedChange={onToggle}
          disabled={!canEdit}
        />
      </div>
      {isVisible && (
        <Input
          id={`${textFieldName}-${templateKey}`}
          aria-label={placeholder}
          {...registerFn(textFieldName)}
          disabled={!canEdit}
          placeholder={placeholder}
          className="text-sm"
        />
      )}
    </div>
  );
}
