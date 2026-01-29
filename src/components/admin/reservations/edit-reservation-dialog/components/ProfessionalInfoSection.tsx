/**
 * Section Informations professionnelles du formulaire d'édition
 * Derviche Diffusion - Session 111
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LABELS } from '../constants';
import type { ProfessionalInfoSectionProps } from '../types';

export function ProfessionalInfoSection({
  organization,
  function: functionValue,
  afcNumber,
  onChange,
  disabled,
}: ProfessionalInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">{LABELS.sectionProfessional}</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Structure / Organisation */}
        <div className="space-y-2">
          <Label htmlFor="organization">{LABELS.organization}</Label>
          <Input
            id="organization"
            value={organization || ''}
            onChange={(e) => onChange('organization', e.target.value || null)}
            disabled={disabled}
            autoComplete="organization"
          />
        </div>
        
        {/* Fonction */}
        <div className="space-y-2">
          <Label htmlFor="function">{LABELS.function}</Label>
          <Input
            id="function"
            value={functionValue || ''}
            onChange={(e) => onChange('function', e.target.value || null)}
            disabled={disabled}
            autoComplete="organization-title"
          />
        </div>
        
        {/* Numéro AFC */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="afcNumber">{LABELS.afcNumber}</Label>
          <Input
            id="afcNumber"
            value={afcNumber || ''}
            onChange={(e) => onChange('afcNumber', e.target.value || null)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
