/**
 * Hook useGenerateSeriesDialog - Logique du dialog de génération de série
 * Derviche Diffusion
 */

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

import type {
  GenerateSeriesData,
  GeneratedRepresentation,
  MockRepresentation,
  MockVenue,
  UseGenerateSeriesDialogReturn,
} from '../types';

import { DEFAULT_SERIES_DATA, DEFAULT_TIME } from '../constants';

// ============================================
// TYPES PROPS DU HOOK
// ============================================

interface UseGenerateSeriesDialogProps {
  /** Dialog ouvert */
  open: boolean;
  /** Callback fermeture */
  onOpenChange: (open: boolean) => void;
  /** Callback soumission */
  onSubmit: (data: GenerateSeriesData, representationsToCreate: GeneratedRepresentation[]) => void | Promise<void>;
  /** Lieux disponibles */
  venues: MockVenue[];
  /** Représentations existantes (détection doublons) */
  existingRepresentations: MockRepresentation[];
  /** ID lieu nouvellement créé */
  newlyCreatedVenueId?: string | null;
  /** Callback reset ID lieu */
  onClearNewlyCreatedVenueId?: () => void;
}

// ============================================
// HOOK
// ============================================

export function useGenerateSeriesDialog({
  open,
  onOpenChange,
  onSubmit,
  venues,
  existingRepresentations,
  newlyCreatedVenueId,
  onClearNewlyCreatedVenueId,
}: UseGenerateSeriesDialogProps): UseGenerateSeriesDialogReturn {
  // ============================================
  // ÉTATS
  // ============================================
  
  const [seriesData, setSeriesData] = useState<GenerateSeriesData>(DEFAULT_SERIES_DATA);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // EFFETS
  // ============================================

  // Auto-sélection du nouveau lieu créé
  useEffect(() => {
    if (newlyCreatedVenueId && open) {
      setSeriesData((prev) => ({ ...prev, venueId: newlyCreatedVenueId }));
      if (onClearNewlyCreatedVenueId) {
        onClearNewlyCreatedVenueId();
      }
    }
  }, [newlyCreatedVenueId, open, onClearNewlyCreatedVenueId]);

  // Réinitialiser les états à l'ouverture
  useEffect(() => {
    if (open) {
      setIsSubmitting(false);
      setError(null);
    }
  }, [open]);

  // ============================================
  // CALCULS MÉMOÏSÉS
  // ============================================

  // Générer les représentations selon les paramètres
  const generatedRepresentations = useMemo(() => {
    const { startDate, endDate, weekDays, times, excludedDates, venueId } = seriesData;

    if (!startDate || !endDate || times.length === 0 || !venueId) {
      return [];
    }

    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    const results: GeneratedRepresentation[] = [];
    const excludedDatesSet = new Set(excludedDates.filter((d) => d.trim() !== ''));

    const currentDate = new Date(start);
    while (currentDate <= end) {
      // Utiliser la date locale pour éviter les décalages de timezone
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentDate.getDate()).padStart(2, '0');
      const dateString = `${y}-${m}-${d}`;
      const dayOfWeek = currentDate.getDay();

      // Vérifier si le jour est activé
      if (!weekDays[dayOfWeek]) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Vérifier si la date est exclue
      if (excludedDatesSet.has(dateString)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const venue = venues.find((v) => v.id === venueId);
      if (venue) {
        times.forEach((time) => {
          // Vérifier doublon exact (même date, heure, lieu)
          const isExactDuplicate = existingRepresentations.some(
            (r) => r.date === dateString && r.time === time && r.venueId === venueId
          );

          // Vérifier conflit (même date, heure, lieu différent)
          const isConflict = !isExactDuplicate && existingRepresentations.some(
            (r) => r.date === dateString && r.time === time && r.venueId !== venueId
          );

          let status: 'ok' | 'exact_duplicate' | 'conflict' = 'ok';
          if (isExactDuplicate) {
            status = 'exact_duplicate';
          } else if (isConflict) {
            status = 'conflict';
          }

          results.push({
            date: dateString,
            time,
            venueId,
            venueName: venue.name,
            status,
          });
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Trier par date/heure
    return results.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [seriesData, existingRepresentations, venues]);

  // Représentations qui seront effectivement créées
  const representationsToCreate = useMemo(() => {
    return generatedRepresentations.filter((rep) => {
      if (rep.status === 'exact_duplicate' && !seriesData.includeExactDuplicates) {
        return false;
      }
      if (rep.status === 'conflict' && !seriesData.includeConflicts) {
        return false;
      }
      return true;
    });
  }, [generatedRepresentations, seriesData.includeExactDuplicates, seriesData.includeConflicts]);

  // Compteurs
  const exactDuplicatesCount = useMemo(
    () => generatedRepresentations.filter((r) => r.status === 'exact_duplicate').length,
    [generatedRepresentations]
  );

  const conflictsCount = useMemo(
    () => generatedRepresentations.filter((r) => r.status === 'conflict').length,
    [generatedRepresentations]
  );

  // Validation
  const isValid = useMemo(() => {
    const { startDate, endDate, weekDays, times, venueId, isUnlimited, capacity } = seriesData;

    if (!startDate || !endDate) return false;
    if (new Date(endDate) < new Date(startDate)) return false;
    if (weekDays.every((d) => !d)) return false;
    if (times.length === 0 || times.some((t) => !t.trim())) return false;
    if (!venueId) return false;
    if (!isUnlimited && (!capacity || capacity < 1)) return false;
    if (representationsToCreate.length === 0) return false;
    
    return true;
  }, [seriesData, representationsToCreate.length]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setSeriesData(DEFAULT_SERIES_DATA);
    setIsExpanded(false);
    setError(null);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(seriesData, representationsToCreate);
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la génération';
      setError(errorMessage);
      setIsSubmitting(false);
      console.error('Erreur lors de la génération:', err);
    }
  }, [isValid, onSubmit, seriesData, representationsToCreate, handleClose]);

  // Mise à jour générique des données
  const updateSeriesData = useCallback((updates: Partial<GenerateSeriesData>) => {
    setSeriesData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Mise à jour d'un jour de semaine
  const setWeekDay = useCallback((index: number, checked: boolean) => {
    setSeriesData((prev) => {
      const newWeekDays = [...prev.weekDays];
      newWeekDays[index] = checked;
      return { ...prev, weekDays: newWeekDays };
    });
  }, []);

  // Horaires
  const addTime = useCallback(() => {
    setSeriesData((prev) => ({
      ...prev,
      times: [...prev.times, DEFAULT_TIME],
    }));
  }, []);

  const removeTime = useCallback((index: number) => {
    setSeriesData((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }));
  }, []);

  const updateTime = useCallback((index: number, value: string) => {
    setSeriesData((prev) => {
      const newTimes = [...prev.times];
      newTimes[index] = value;
      return { ...prev, times: newTimes };
    });
  }, []);

  // Dates exclues
  const addExcludedDate = useCallback(() => {
    setSeriesData((prev) => ({
      ...prev,
      excludedDates: [...prev.excludedDates, ''],
    }));
  }, []);

  const removeExcludedDate = useCallback((index: number) => {
    setSeriesData((prev) => ({
      ...prev,
      excludedDates: prev.excludedDates.filter((_, i) => i !== index),
    }));
  }, []);

  const updateExcludedDate = useCallback((index: number, value: string) => {
    setSeriesData((prev) => {
      const newDates = [...prev.excludedDates];
      newDates[index] = value;
      return { ...prev, excludedDates: newDates };
    });
  }, []);

  // ============================================
  // RETOUR
  // ============================================

  return {
    // État
    seriesData,
    isExpanded,
    isSubmitting,
    error,
    
    // Données calculées
    generatedRepresentations,
    representationsToCreate,
    exactDuplicatesCount,
    conflictsCount,
    isValid,
    
    // Handlers état
    setIsExpanded,
    
    // Handlers données série
    updateSeriesData,
    setWeekDay,
    
    // Handlers horaires
    addTime,
    removeTime,
    updateTime,
    
    // Handlers dates exclues
    addExcludedDate,
    removeExcludedDate,
    updateExcludedDate,
    
    // Actions
    handleSubmit,
    handleClose,
  };
}
