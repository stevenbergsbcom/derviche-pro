/**
 * Section Informations personnelles du formulaire d'édition
 * Derviche Diffusion - Session 111
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LABELS } from '../constants';
import type { PersonalInfoSectionProps } from '../types';

export function PersonalInfoSection({
  firstName,
  lastName,
  email,
  phone,
  emailSecondary,
  phoneSecondary,
  onChange,
  disabled,
}: PersonalInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">{LABELS.sectionPersonal}</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Prénom */}
        <div className="space-y-2">
          <Label htmlFor="firstName">{LABELS.firstName} *</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            disabled={disabled}
            required
            autoComplete="given-name"
          />
        </div>
        
        {/* Nom */}
        <div className="space-y-2">
          <Label htmlFor="lastName">{LABELS.lastName} *</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            disabled={disabled}
            required
            autoComplete="family-name"
          />
        </div>
        
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">{LABELS.email} *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onChange('email', e.target.value)}
            disabled={disabled}
            required
            autoComplete="email"
          />
        </div>
        
        {/* Téléphone */}
        <div className="space-y-2">
          <Label htmlFor="phone">{LABELS.phone}</Label>
          <Input
            id="phone"
            type="tel"
            value={phone || ''}
            onChange={(e) => onChange('phone', e.target.value || null)}
            disabled={disabled}
            autoComplete="tel"
          />
        </div>
        
        {/* Email secondaire */}
        <div className="space-y-2">
          <Label htmlFor="emailSecondary">{LABELS.emailSecondary}</Label>
          <Input
            id="emailSecondary"
            type="email"
            value={emailSecondary || ''}
            onChange={(e) => onChange('emailSecondary', e.target.value || null)}
            disabled={disabled}
          />
        </div>
        
        {/* Téléphone secondaire */}
        <div className="space-y-2">
          <Label htmlFor="phoneSecondary">{LABELS.phoneSecondary}</Label>
          <Input
            id="phoneSecondary"
            type="tel"
            value={phoneSecondary || ''}
            onChange={(e) => onChange('phoneSecondary', e.target.value || null)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
