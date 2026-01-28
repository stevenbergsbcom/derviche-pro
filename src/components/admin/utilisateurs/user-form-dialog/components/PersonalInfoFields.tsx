/**
 * Composant PersonalInfoFields - Prénom, Nom, Téléphone
 * Derviche Diffusion - Session 102
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PersonalInfoFieldsProps } from '../types';

/**
 * Champs d'informations personnelles (prénom, nom, téléphone)
 */
export function PersonalInfoFields({
  firstName,
  lastName,
  phone,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  isSubmitting,
}: PersonalInfoFieldsProps) {
  return (
    <>
      {/* Prénom et Nom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Prénom</Label>
          <Input
            id="first_name"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="Ex: Marie"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Nom</Label>
          <Input
            id="last_name"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Ex: Dupont"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Téléphone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="06 12 34 56 78"
          disabled={isSubmitting}
        />
      </div>
    </>
  );
}
