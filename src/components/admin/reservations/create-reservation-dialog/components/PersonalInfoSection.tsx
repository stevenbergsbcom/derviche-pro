/**
 * Section Informations personnelles du formulaire
 * Derviche Diffusion - Session 104
 */

'use client';

import { User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { PersonalInfoSectionProps } from '../types';
import { LABELS, PLACEHOLDERS } from '../constants';

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
      <h4 className="font-medium flex items-center gap-2">
        <User className="w-4 h-4" aria-hidden="true" />
        {LABELS.sectionPersonal}
      </h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Prénom */}
        <div className="space-y-2">
          <Label htmlFor="firstName">{LABELS.firstName} *</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            placeholder={PLACEHOLDERS.firstName}
            disabled={disabled}
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
            placeholder={PLACEHOLDERS.lastName}
            disabled={disabled}
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
            placeholder={PLACEHOLDERS.email}
            disabled={disabled}
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
            placeholder={PLACEHOLDERS.phone}
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
