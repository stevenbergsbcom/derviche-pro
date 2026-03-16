/**
 * BookingStepsPanel — Colonne droite avec navigation par etapes
 * Derviche Diffusion - Page spectacle
 *
 * Affiche le fil d'Ariane, le bouton retour et le contenu
 * de l'etape active (calendrier, creneau, participants, formulaire).
 */

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import type { TimeSlot, Step, ReservationFormData } from '../types';
import type { PublicShow } from '@/lib/services/public-catalog';
import {
  AdminBlockBanner,
  StepsIndicator,
  CalendarStep,
  TimeStep,
  ParticipantsStep,
  ReservationFormStep,
} from './index';

// ============================================
// PROPS
// ============================================

interface BookingStepsPanelProps {
  /** Donnees du spectacle */
  show: PublicShow;
  /** Etape active */
  currentStep: Step;
  /** Numero d'etape pour le fil d'Ariane (1, 2 ou 3) */
  activeStepNumber: number;
  /** Role admin detecte */
  isAdminRole: boolean;
  /** Chargement du role en cours */
  isRoleLoading: boolean;
  /** Spectacle bientot reservable (pas encore de creneaux) */
  isComingSoon: boolean;

  /** Calendrier */
  currentMonth: Date;
  calendarDays: (Date | null)[];
  datesWithSlots: Set<string>;
  selectedDate: Date | null;
  onDayClick: (date: Date | null) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;

  /** Creneaux */
  slotsForSelectedDate: TimeSlot[];
  onSlotSelect: (slot: TimeSlot) => void;

  /** Participants */
  participantCount: number;
  maxReservations: number;
  onParticipantChange: (delta: number) => void;
  onContinueToForm: () => void;

  /** Formulaire */
  selectedSlot: TimeSlot | null;
  formData: ReservationFormData;
  isSubmitting: boolean;
  submitError: string | null;
  onFormDataChange: (updates: Partial<ReservationFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;

  /** Navigation */
  onBack: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function BookingStepsPanel({
  show,
  currentStep,
  activeStepNumber,
  isAdminRole,
  isRoleLoading,
  isComingSoon,
  currentMonth,
  calendarDays,
  datesWithSlots,
  selectedDate,
  onDayClick,
  onPreviousMonth,
  onNextMonth,
  slotsForSelectedDate,
  onSlotSelect,
  participantCount,
  maxReservations,
  onParticipantChange,
  onContinueToForm,
  selectedSlot,
  formData,
  isSubmitting,
  submitError,
  onFormDataChange,
  onSubmit,
  onBack,
}: BookingStepsPanelProps) {
  return (
    <div className="p-6 md:p-8">
      {/* Bandeau d'alerte pour les admins */}
      <AdminBlockBanner isAdminRole={isAdminRole} isRoleLoading={isRoleLoading} />

      {/* Fil d'Ariane */}
      <StepsIndicator activeStepNumber={activeStepNumber} />

      {/* Bouton retour (sauf etape calendar) */}
      {currentStep !== 'calendar' && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-derviche hover:text-derviche-dark"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      )}

      {/* Contenu selon l'etape */}
      <div className="transition-all duration-300">
        {currentStep === 'calendar' && (
          <CalendarStep
            isComingSoon={isComingSoon}
            currentMonth={currentMonth}
            calendarDays={calendarDays}
            datesWithSlots={datesWithSlots}
            selectedDate={selectedDate}
            onDayClick={onDayClick}
            onPreviousMonth={onPreviousMonth}
            onNextMonth={onNextMonth}
          />
        )}
        {currentStep === 'time' && (
          <TimeStep
            selectedDate={selectedDate}
            slotsForSelectedDate={slotsForSelectedDate}
            isAdminRole={isAdminRole}
            onSlotSelect={onSlotSelect}
          />
        )}
        {currentStep === 'participants' && (
          <ParticipantsStep
            participantCount={participantCount}
            maxReservations={maxReservations}
            onParticipantChange={onParticipantChange}
            onContinue={onContinueToForm}
            invitationPolicy={show.invitationPolicy}
            dervisheManager={show.dervisheManager}
          />
        )}
        {currentStep === 'form' && (
          <ReservationFormStep
            selectedSlot={selectedSlot}
            participantCount={participantCount}
            formData={formData}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onFormDataChange={onFormDataChange}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </div>
  );
}
