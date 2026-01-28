/**
 * Composant AlertBanner - Bannière d'alerte avec checkbox
 * Utilisé pour les warnings de doublons et conflits
 */

import { AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import type { AlertBannerProps } from '../types';

/** Classes CSS par variante */
const VARIANT_CLASSES = {
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    label: 'text-red-800',
  },
  warning: {
    container: 'bg-orange-50 border-orange-200',
    icon: 'text-orange-600',
    title: 'text-orange-900',
    label: 'text-orange-800',
  },
} as const;

export function AlertBanner({
  variant,
  title,
  checkboxLabel,
  checkboxId,
  checked,
  onCheckedChange,
}: AlertBannerProps) {
  const classes = VARIANT_CLASSES[variant];

  return (
    <div role="alert" className={`flex items-start gap-2 p-3 border rounded-md ${classes.container}`}>
      <AlertTriangle 
        className={`w-5 h-5 shrink-0 mt-0.5 ${classes.icon}`} 
        aria-hidden="true" 
      />
      <div className="flex-1">
        <p className={`text-sm font-medium ${classes.title}`}>
          {title}
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id={checkboxId}
            checked={checked}
            onCheckedChange={(checkedState) => {
              onCheckedChange(checkedState === true);
            }}
          />
          <Label 
            htmlFor={checkboxId} 
            className={`font-normal cursor-pointer text-sm ${classes.label}`}
          >
            {checkboxLabel}
          </Label>
        </div>
      </div>
    </div>
  );
}
