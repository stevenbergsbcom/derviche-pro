/**
 * Section Notes du formulaire
 * Derviche Diffusion - Session 104
 */

'use client';

import { FileText, Lock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
          <p className="text-xs text-muted-foreground">Saisi par le professionnel lors de la réservation</p>
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
        
        {/* Notes internes Derviche */}
        <div className="space-y-2">
          <Label htmlFor="checkinInternalNotes" className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            {LABELS.checkinInternalNotes}
            <Badge variant="outline" className="text-xs ml-1">Admin</Badge>
          </Label>
          <p className="text-xs text-muted-foreground">Non visibles par les compagnies</p>
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
