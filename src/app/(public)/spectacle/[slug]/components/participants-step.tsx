/**
 * ParticipantsStep — Compteur de participants
 * Derviche Diffusion - Page spectacle
 */

import { Button } from '@/components/ui/button';
import { Info, Calendar, Users, Minus, Plus } from 'lucide-react';

// ============================================
// PROPS
// ============================================

interface ParticipantsStepProps {
  participantCount: number;
  maxReservations: number;
  onParticipantChange: (delta: number) => void;
  onContinue: () => void;
  /** Politique d'invitation (texte libre depuis la fiche spectacle) */
  invitationPolicy: string | null;
  /** Responsable Derviche pour le contact */
  dervisheManager: {
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string;
  } | null;
}

// ============================================
// COMPONENT
// ============================================

export function ParticipantsStep({
  participantCount,
  maxReservations,
  onParticipantChange,
  onContinue,
  invitationPolicy,
  dervisheManager,
}: ParticipantsStepProps) {
  return (
    <>
      {/* Encart info professionnel — affiché si invitation_policy OU manager existe */}
      {(invitationPolicy || dervisheManager) && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Pour les professionnels :</p>
              {invitationPolicy && (
                <p dangerouslySetInnerHTML={{ __html: invitationPolicy }} />
              )}
              {dervisheManager && (
                <p className={invitationPolicy ? 'mt-1' : ''}>
                  Contact pour toute précision sur votre réservation
                  {' : '}
                  {dervisheManager.firstName} {dervisheManager.lastName}
                  {dervisheManager.phone && ` - ${dervisheManager.phone}`}
                  {' - '}
                  {dervisheManager.email}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Encart info success */}
      <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            Une invitation calendrier sera envoyée automatiquement avec votre réservation
          </p>
        </div>
      </div>

      {/* Nombre de participants */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-derviche-dark mb-4">
          Combien de personnes assisteront à la représentation ?
        </h3>
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onParticipantChange(-1)}
            disabled={participantCount <= 1}
            className="rounded-full h-10 w-10"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-derviche" />
            <span className="text-2xl font-bold text-derviche-dark w-8 text-center">
              {participantCount}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onParticipantChange(1)}
            disabled={participantCount >= maxReservations}
            className="rounded-full h-10 w-10"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground text-center mt-4">
          Maximum {maxReservations} personne{maxReservations > 1 ? 's' : ''} par réservation
        </p>
      </div>

      {/* Bouton continuer */}
      <Button
        className="w-full bg-derviche hover:bg-derviche-dark text-white"
        onClick={onContinue}
      >
        Continuer
      </Button>
    </>
  );
}
