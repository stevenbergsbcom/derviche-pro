/**
 * Section Notes du formulaire
 * Derviche Diffusion - Session 104
 */

'use client';

import { FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { NotesSectionProps } from '../types';
import { LABELS, PLACEHOLDERS } from '../constants';

export function NotesSection({
  comment,
  checkinComment,
  checkinVenueNotes,
  checkinInternalNotes,
  onChange,
  disabled,
}: NotesSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <FileText className="w-4 h-4" aria-hidden="true" />
        {LABELS.sectionNotes}
      </h4>
      
      <div className="space-y-4">
        {/* Demandes spéciales */}
        <div className="space-y-2">
          <Label htmlFor="comment">{LABELS.comment}</Label>
          <Textarea
            id="comment"
            value={comment || ''}
            onChange={(e) => onChange('comment', e.target.value || null)}
            rows={2}
            placeholder={PLACEHOLDERS.comment}
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
            placeholder={PLACEHOLDERS.checkinComment}
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
            placeholder={PLACEHOLDERS.checkinVenueNotes}
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
            placeholder={PLACEHOLDERS.checkinInternalNotes}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
