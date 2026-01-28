/**
 * GenerateSeriesDialog - Dialog de génération en série de représentations
 * Derviche Diffusion
 * 
 * Orchestrateur utilisant:
 * - useGenerateSeriesDialog (logique)
 * - Sous-composants (UI)
 */

'use client';

import { Maximize2, Minimize2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useGenerateSeriesDialog } from './hooks';
import { getLocalDateString } from './utils';
import {
  PeriodSection,
  WeekDaysSection,
  TimesSection,
  ExcludedDatesSection,
  VenueSection,
  CapacitySection,
  HostedBySection,
  PreviewSection,
} from './components';

import type { GenerateSeriesDialogProps } from './types';

// Réexports pour compatibilité
export type { 
  GenerateSeriesData, 
  GeneratedRepresentation,
  GenerateSeriesDialogProps,
} from './types';

/**
 * Modale de génération en série de représentations
 */
export function GenerateSeriesDialog({
  open,
  onOpenChange,
  onSubmit,
  venues,
  dervisheUsers,
  existingRepresentations,
  onOpenNewVenueDialog,
  newlyCreatedVenueId,
  onClearNewlyCreatedVenueId,
}: GenerateSeriesDialogProps) {
  // Hook centralisé pour toute la logique
  const {
    seriesData,
    isExpanded,
    isSubmitting,
    error,
    generatedRepresentations,
    representationsToCreate,
    exactDuplicatesCount,
    conflictsCount,
    isValid,
    setIsExpanded,
    updateSeriesData,
    setWeekDay,
    addTime,
    removeTime,
    updateTime,
    addExcludedDate,
    removeExcludedDate,
    updateExcludedDate,
    handleSubmit,
    handleClose,
  } = useGenerateSeriesDialog({
    open,
    onOpenChange,
    onSubmit,
    venues,
    existingRepresentations,
    newlyCreatedVenueId,
    onClearNewlyCreatedVenueId,
  });

  const minDate = getLocalDateString();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent 
        className={`w-full max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden flex flex-col transition-all duration-200 ${
          isExpanded ? 'sm:max-w-6xl sm:h-[90vh]' : 'sm:max-w-lg'
        }`}
      >
        {/* Header */}
        <DialogHeader className="relative">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Générer une série</DialogTitle>
              <DialogDescription>
                Créez plusieurs représentations en une seule fois en définissant une période, des horaires et des jours de la semaine.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-8 w-8 shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Réduire' : 'Agrandir'}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="w-4 h-4" aria-hidden="true" />
              )}
              <span className="sr-only">{isExpanded ? 'Réduire' : 'Agrandir'}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          {/* Erreur globale */}
          {error && (
            <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Période */}
          <PeriodSection
            startDate={seriesData.startDate}
            endDate={seriesData.endDate}
            onStartDateChange={(value) => updateSeriesData({ startDate: value })}
            onEndDateChange={(value) => updateSeriesData({ endDate: value })}
            minDate={minDate}
          />

          {/* Jours de la semaine */}
          <WeekDaysSection
            weekDays={seriesData.weekDays}
            onWeekDayChange={setWeekDay}
          />

          {/* Horaires */}
          <TimesSection
            times={seriesData.times}
            onTimeChange={updateTime}
            onAddTime={addTime}
            onRemoveTime={removeTime}
          />

          {/* Dates exclues */}
          <ExcludedDatesSection
            excludedDates={seriesData.excludedDates}
            onExcludedDateChange={updateExcludedDate}
            onAddExcludedDate={addExcludedDate}
            onRemoveExcludedDate={removeExcludedDate}
          />

          {/* Lieu */}
          <VenueSection
            venueId={seriesData.venueId}
            venues={venues}
            onVenueChange={(venueId) => updateSeriesData({ venueId })}
            onOpenNewVenueDialog={onOpenNewVenueDialog}
          />

          {/* Capacité */}
          <CapacitySection
            capacity={seriesData.capacity}
            isUnlimited={seriesData.isUnlimited}
            onCapacityChange={(capacity) => updateSeriesData({ capacity })}
            onUnlimitedChange={(isUnlimited) => updateSeriesData({ isUnlimited })}
          />

          {/* Accueil */}
          <HostedBySection
            hostedBy={seriesData.hostedBy}
            hostedById={seriesData.hostedById}
            dervisheUsers={dervisheUsers}
            onHostedByChange={(hostedBy) => updateSeriesData({ hostedBy })}
            onHostedByIdChange={(hostedById) => updateSeriesData({ hostedById })}
          />

          {/* Aperçu */}
          <PreviewSection
            generatedRepresentations={generatedRepresentations}
            exactDuplicatesCount={exactDuplicatesCount}
            conflictsCount={conflictsCount}
            includeExactDuplicates={seriesData.includeExactDuplicates}
            includeConflicts={seriesData.includeConflicts}
            onIncludeExactDuplicatesChange={(checked) => updateSeriesData({ includeExactDuplicates: checked })}
            onIncludeConflictsChange={(checked) => updateSeriesData({ includeConflicts: checked })}
          />
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={!isValid || isSubmitting}
            className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Génération...
              </>
            ) : (
              <>
                Générer {representationsToCreate.length > 0 && `(${representationsToCreate.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
