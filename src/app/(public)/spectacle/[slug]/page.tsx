'use client';

/**
 * SpectacleDetailPage — Page publique de detail et reservation d'un spectacle
 * Derviche Diffusion
 *
 * Orchestrateur mince : la logique metier est dans useSpectacleBooking,
 * le rendu est delegue aux sous-composants.
 */

import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AuthSuccessData } from '@/components/auth';
import { ArrowLeft } from 'lucide-react';

import { useSpectacleBooking } from './hooks/useSpectacleBooking';
import {
  MountingState,
  LoadingState,
  ErrorState,
  NotFoundState,
  ShowDetailSidebar,
  BookingStepsPanel,
  BookingDialogs,
} from './components';

// ============================================
// COMPOSANT PAGE
// ============================================

export default function SpectacleDetailPage() {
  const booking = useSpectacleBooking();

  // --- Early returns ---

  if (!booking.isMounted) {
    return <MountingState />;
  }

  if (booking.isLoading) {
    return <LoadingState />;
  }

  if (booking.error) {
    return <ErrorState error={booking.error} onRetry={() => void booking.refresh()} />;
  }

  if (booking.notFound || !booking.show) {
    return <NotFoundState />;
  }

  const { show } = booking;

  // --- Handlers pour les modales ---

  const handleAuthSuccess = (data: AuthSuccessData) => {
    booking.setFormData((prev) => ({
      ...prev,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    }));
    booking.setShowAuthModal(false);
    booking.setCurrentStep('form');
  };

  const handleContinueAsGuest = () => {
    booking.setShowAuthModal(false);
    booking.setCurrentStep('form');
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Bouton retour */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" className="text-derviche hover:text-derviche-dark" asChild>
          <Link href="/catalogue" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour au catalogue
          </Link>
        </Button>
      </div>

      {/* Card principale - Layout Calendly */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <Card className="bg-white rounded-xl shadow-lg overflow-hidden p-0">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Colonne gauche - Infos */}
                <ShowDetailSidebar
                  show={show}
                  hasImage={booking.hasImage}
                  onImageError={booking.onImageError}
                  duration={booking.duration}
                  description={booking.description}
                  showFullDescription={booking.showFullDescription}
                  onToggleDescription={booking.onToggleDescription}
                />

                {/* Colonne droite - Etapes */}
                <BookingStepsPanel
                  show={show}
                  currentStep={booking.currentStep}
                  activeStepNumber={booking.activeStepNumber}
                  isAdminRole={booking.isAdminRole}
                  isRoleLoading={booking.isRoleLoading}
                  isCompanyMode={booking.isCompanyMode}
                  companyName={booking.companyName}
                  isComingSoon={booking.isComingSoon}
                  currentMonth={booking.currentMonth}
                  calendarDays={booking.calendarDays}
                  datesWithSlots={booking.datesWithSlots}
                  selectedDate={booking.selectedDate}
                  onDayClick={booking.handleDayClick}
                  onPreviousMonth={booking.goToPreviousMonth}
                  onNextMonth={booking.goToNextMonth}
                  slotsForSelectedDate={booking.slotsForSelectedDate}
                  onSlotSelect={booking.handleSlotSelect}
                  participantCount={booking.participantCount}
                  maxReservations={booking.maxReservations}
                  onParticipantChange={booking.handleParticipantChange}
                  onContinueToForm={() => {
                    void booking.handleContinueToForm();
                  }}
                  selectedSlot={booking.selectedSlot}
                  formData={booking.formData}
                  isSubmitting={booking.isSubmitting}
                  submitError={booking.submitError}
                  onFormDataChange={booking.handleFormDataChange}
                  onSubmit={booking.handleFormSubmit}
                  onBack={booking.handleBack}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modales */}
      <BookingDialogs
        showAuthModal={booking.showAuthModal}
        onAuthModalChange={booking.setShowAuthModal}
        onAuthSuccess={handleAuthSuccess}
        onContinueAsGuest={handleContinueAsGuest}
        showDuplicateDialog={booking.showDuplicateDialog}
        duplicateInfo={booking.duplicateInfo}
        email={booking.formData.email}
        onConfirmDuplicate={booking.handleConfirmDuplicate}
        onCancelDuplicate={booking.handleCancelDuplicate}
        showPastSlotDialog={booking.showPastSlotDialog}
        onConfirmPastSlot={booking.handleConfirmPastSlot}
        onCancelPastSlot={booking.handleCancelPastSlot}
      />

      <Footer />
    </div>
  );
}
