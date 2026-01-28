/**
 * Section descriptions (description, politique invitation, max participants)
 * Derviche Diffusion - Session 101
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import type { DescriptionsSectionProps } from '../types';

export function DescriptionsSection({
  description,
  invitationPolicy,
  maxParticipantsPerBooking,
  onDescriptionChange,
  onInvitationPolicyChange,
  onMaxParticipantsChange,
}: DescriptionsSectionProps) {
  return (
    <>
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <WysiwygEditor
          value={description || ''}
          onChange={onDescriptionChange}
          placeholder="Description du spectacle..."
          rows={4}
        />
      </div>

      {/* Politique invitation/détaxe */}
      <div className="space-y-2">
        <Label htmlFor="invitationPolicy">Politique invitation/détaxe</Label>
        <WysiwygEditor
          value={invitationPolicy || ''}
          onChange={onInvitationPolicyChange}
          placeholder="Conditions d'invitation et détaxe..."
          rows={3}
        />
      </div>

      {/* Nombre max participants */}
      <div className="space-y-2">
        <Label htmlFor="maxParticipantsPerBooking">
          Nombre max de participants par réservation
        </Label>
        <Input
          id="maxParticipantsPerBooking"
          type="number"
          min="1"
          value={maxParticipantsPerBooking || ''}
          onChange={(e) => {
            const value = e.target.value;
            onMaxParticipantsChange(value ? parseInt(value, 10) : undefined);
          }}
        />
      </div>
    </>
  );
}
