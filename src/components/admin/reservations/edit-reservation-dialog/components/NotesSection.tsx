/**
 * Section Notes du formulaire d'édition
 * Derviche Diffusion - Session 111
 */

'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LABELS } from '../constants';
import type { NotesSectionProps } from '../types';

export function NotesSection({
  specialRequests,
  checkinComment,
  checkinVenueNotes,
  checkinInternalNotes,
  onChange,
  disabled,
}: NotesSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">{LABELS.sectionNotes}</h4>
      
      <div className="space-y-4">
        {/* Demandes spéciales */}
        <div className="space-y-2">
          <Label htmlFor="specialRequests">{LABELS.specialRequests}</Label>
          <Textarea
            id="specialRequests"
            value={specialRequests || ''}
            onChange={(e) => onChange('specialRequests', e.target.value || null)}
            rows={2}
            disabled={disabled}
          />
        </div>
        
        {/* Notes check-in */}
        <div className="space-y-2">
          <Label htmlFor="checkinComment">{LABELS.checkinComment}</Label>
          <Textarea
            id="checkinComment"
            value={checkinComment || ''}
            onChange={(e) => onChange('checkinComment', e.target.value || null)}
            rows={2}
            disabled={disabled}
          />
        </div>
        
        {/* Notes lieu */}
        <div className="space-y-2">
          <Label htmlFor="checkinVenueNotes">{LABELS.checkinVenueNotes}</Label>
          <Textarea
            id="checkinVenueNotes"
            value={checkinVenueNotes || ''}
            onChange={(e) => onChange('checkinVenueNotes', e.target.value || null)}
            rows={2}
            disabled={disabled}
          />
        </div>
        
        {/* Notes internes */}
        <div className="space-y-2">
          <Label htmlFor="checkinInternalNotes">{LABELS.checkinInternalNotes}</Label>
          <Textarea
            id="checkinInternalNotes"
            value={checkinInternalNotes || ''}
            onChange={(e) => onChange('checkinInternalNotes', e.target.value || null)}
            rows={2}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
