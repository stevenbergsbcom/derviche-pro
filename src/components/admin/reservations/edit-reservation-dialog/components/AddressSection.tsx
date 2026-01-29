/**
 * Section Adresse du formulaire d'édition
 * Derviche Diffusion - Session 111
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LABELS } from '../constants';
import type { AddressSectionProps } from '../types';

export function AddressSection({
  address,
  postalCode,
  city,
  onChange,
  disabled,
}: AddressSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">{LABELS.sectionAddress}</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Adresse */}
        <div className="space-y-2 sm:col-span-3">
          <Label htmlFor="address">{LABELS.address}</Label>
          <Input
            id="address"
            value={address || ''}
            onChange={(e) => onChange('address', e.target.value || null)}
            disabled={disabled}
            autoComplete="street-address"
          />
        </div>
        
        {/* Code postal */}
        <div className="space-y-2">
          <Label htmlFor="postalCode">{LABELS.postalCode}</Label>
          <Input
            id="postalCode"
            value={postalCode || ''}
            onChange={(e) => onChange('postalCode', e.target.value || null)}
            disabled={disabled}
            autoComplete="postal-code"
          />
        </div>
        
        {/* Ville */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="city">{LABELS.city}</Label>
          <Input
            id="city"
            value={city || ''}
            onChange={(e) => onChange('city', e.target.value || null)}
            disabled={disabled}
            autoComplete="address-level2"
          />
        </div>
      </div>
    </div>
  );
}
