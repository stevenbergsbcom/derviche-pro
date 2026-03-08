/**
 * NotesSection - Champs de notes (commentaire, venue, internes)
 * Derviche Diffusion
 */

'use client';

import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, MapPin, Lock } from 'lucide-react';
import type { CheckinFormState } from '../types';

// ============================================
// TYPES
// ============================================

export interface NotesSectionProps {
  /** État du formulaire check-in */
  checkinForm: CheckinFormState;
  /** En cours de traitement ? */
  isSubmitting: boolean;
  /** Callbacks de mise à jour */
  onCommentChange: (value: string) => void;
  onVenueNotesChange: (value: string) => void;
  onInternalNotesChange: (value: string) => void;
}

// ============================================
// COMPOSANT
// ============================================

export function NotesSection({
  checkinForm,
  isSubmitting,
  onCommentChange,
  onVenueNotesChange,
  onInternalNotesChange,
}: NotesSectionProps) {
  return (
    <div className="space-y-4">
      {/* Champ commentaire */}
      <div>
        <label 
          htmlFor="checkin-comment" 
          className="flex items-center gap-2 text-base font-medium text-muted-foreground mb-2"
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          Notes accueil
        </label>
        <Textarea
          id="checkin-comment"
          value={checkinForm.comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Note sur l'invité..."
          rows={3}
          disabled={isSubmitting}
          className="resize-none text-base"
        />
      </div>

      {/* Notes venue */}
      <div>
        <label 
          htmlFor="checkin-venue-notes" 
          className="flex items-center gap-2 text-base font-medium text-muted-foreground mb-2"
        >
          <MapPin className="w-4 h-4" aria-hidden="true" />
          Notes sur le lieu
        </label>
        <Textarea
          id="checkin-venue-notes"
          value={checkinForm.venueNotes}
          onChange={(e) => onVenueNotesChange(e.target.value)}
          placeholder="Informations liées au lieu, à l'accueil..."
          rows={3}
          disabled={isSubmitting}
          className="resize-none text-base"
        />
      </div>

      {/*
       * DÉCISION MÉTIER INTENTIONNELLE — Ne pas modifier sans validation.
       * Les notes internes Derviche sont visibles et modifiables par TOUT le staff DD
       * sur place (admin ET externe), car ils travaillent ensemble à l'accueil.
       * Seules les compagnies (role: 'company') ne doivent jamais voir ce champ,
       * même quand elles assurent elles-mêmes l'accueil de leur spectacle.
       * Le backend (ADMIN_ROLES) protège déjà l'écriture en BDD.
       */}
      <div>
        <label 
          htmlFor="checkin-internal-notes" 
          className="flex items-center gap-2 text-base font-medium text-muted-foreground mb-2"
        >
          <Lock className="w-4 h-4" aria-hidden="true" />
          Notes internes Derviche
          <Badge variant="outline" className="text-xs ml-1">Admin</Badge>
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Non visibles par les compagnies
        </p>
        <Textarea
          id="checkin-internal-notes"
          value={checkinForm.internalNotes}
          onChange={(e) => onInternalNotesChange(e.target.value)}
          placeholder="Notes confidentielles Derviche..."
          rows={3}
          disabled={isSubmitting}
          className="resize-none text-base"
        />
      </div>
    </div>
  );
}
