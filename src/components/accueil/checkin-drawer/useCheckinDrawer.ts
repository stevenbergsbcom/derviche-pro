/**
 * Hook useCheckinDrawer - Orchestrateur du drawer de pointage
 * Derviche Diffusion
 * 
 * Assemble les hooks spécialisés :
 * - useGuestForm : 13 champs guest
 * - useCheckinForm : 4 champs check-in
 * - useCheckinActions : handlers save/reactivate/cancel
 * 
 * Refactoré Session 88 : 520 lignes → ~150 lignes
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import type { ReservationRowData } from '../ReservationRow';
import type { UseCheckinDrawerReturn } from './types';
import { useGuestForm, useCheckinForm, useCheckinActions } from './hooks';
import { updateCheckinStatus } from '@/lib/services/checkin';
import { mapResultToReservationUpdate, hasNotesChanges } from './helpers';
import type { CheckinResultData, GuestResultData } from './helpers';
import {
  DEFAULT_NOTIFICATION_OPTIONS,
  type NotificationOptions,
} from '@/components/admin/reservations/notification-switches';
import { getFullName } from './constants';
import type { CheckinStatus } from '@/types/database';

/** Délai d'inactivité de frappe avant l'auto-save des notes */
const NOTES_AUTOSAVE_DELAY_MS = 1500;

// ============================================
// PROPS DU HOOK
// ============================================

interface UseCheckinDrawerProps {
  reservation: ReservationRowData | null;
  onSuccess: (updatedReservation: ReservationRowData) => void;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// HOOK
// ============================================

export function useCheckinDrawer({
  reservation,
  onSuccess,
  onOpenChange,
}: UseCheckinDrawerProps): UseCheckinDrawerReturn {
  // ==========================================
  // HOOKS SPÉCIALISÉS
  // ==========================================
  const { userId, role, companyId, isAdmin, isLoading: accessLoading } = useCheckinAccess();
  // Vrai pour tout le staff DD (admin + externe) — jamais pour les compagnies
  const isStaffDD = role !== null && role !== 'company';
  // Emails post-checkin : staff DD + compagnies (jamais les professionnels)
  const canSendCheckinEmails = role !== null && role !== 'professional';
  
  const {
    guestForm,
    setGuestFirstName,
    setGuestLastName,
    setGuestEmail,
    setGuestEmailSecondary,
    setGuestPhone,
    setGuestPhoneSecondary,
    setGuestStructure,
    setGuestFunction,
    setGuestAddress,
    setGuestPostalCode,
    setGuestCity,
    setGuestCountry,
    setGuestAfcNumber,
    setSpecialRequests,
    resetFromReservation: resetGuestForm,
    checkHasChanges: checkGuestHasChanges,
  } = useGuestForm();

  const {
    checkinForm,
    setSelectedStatus,
    setComment,
    setVenueNotes,
    setInternalNotes,
    resetFromReservation: resetCheckinForm,
    checkHasChanges: checkCheckinHasChanges,
  } = useCheckinForm();

  // ==========================================
  // ÉTATS UI
  // ==========================================
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [justReactivated, setJustReactivated] = useState(false);
  const [localStatus, setLocalStatus] = useState<'confirmed' | 'cancelled' | 'no_show'>('confirmed');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reactivateNotifOptions, setReactivateNotifOptions] = useState<NotificationOptions>(DEFAULT_NOTIFICATION_OPTIONS);
  // Dernier état connu en base. La prop `reservation` n'est pas rafraîchie par le
  // parent tant que le drawer est ouvert : après chaque auto-save réussi, c'est
  // cet état qui sert de référence (indicateur « non enregistré », rollback).
  const [savedReservation, setSavedReservation] = useState<ReservationRowData | null>(null);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const isCancelled = localStatus === 'cancelled';
  const displayName = getFullName(guestForm.firstName, guestForm.lastName);
  const baseline = savedReservation ?? reservation;

  const hasChanges = useMemo(() => {
    if (!baseline) return false;
    return checkGuestHasChanges(baseline) || checkCheckinHasChanges(baseline);
  }, [baseline, checkGuestHasChanges, checkCheckinHasChanges]);

  const isResettingStatus = checkinForm.selectedStatus === null && baseline?.checkinStatus !== null;
  const canSave = (checkinForm.selectedStatus !== null || isResettingStatus || hasChanges) && !accessLoading;

  // Notes courantes du formulaire, au format attendu par le service.
  // Les notes internes ne sont envoyées que par le staff DD (le formulaire est
  // vide pour une compagnie : les envoyer écraserait la valeur en base).
  const notesPayload = useMemo(() => ({
    comment: checkinForm.comment.trim() || null,
    venueNotes: checkinForm.venueNotes.trim() || null,
    internalNotes: isStaffDD ? (checkinForm.internalNotes.trim() || null) : undefined,
  }), [checkinForm.comment, checkinForm.venueNotes, checkinForm.internalNotes, isStaffDD]);

  // Callback stable pour réinitialiser le statut (évite re-renders inutiles)
  const clearSelectedStatus = useCallback(() => setSelectedStatus(null), [setSelectedStatus]);

  // ==========================================
  // HOOK ACTIONS (après computed values pour isCancelled)
  // ==========================================
  const { isSubmitting, handleSave, handleReactivate, handleCancel } = useCheckinActions({
    reservation,
    guestForm,
    checkinForm,
    isStaffDD,
    isCancelled,
    userId,
    role,
    companyId,
    onSuccess,
    onOpenChange,
    setLocalStatus,
    setJustReactivated,
    setSelectedStatus: clearSelectedStatus,
    reactivateNotifOptions,
  });

  // ==========================================
  // SÉRIALISATION DES AUTO-SAVES
  // ==========================================
  // Les auto-saves (notes, statut) peuvent se déclencher à quelques ms
  // d'intervalle avec des contenus différents ; les envoyer en parallèle
  // laisserait le serveur libre de les appliquer dans le désordre (une note
  // plus ancienne écrasant la plus récente). Chaque requête attend la fin de
  // la précédente : la dernière réponse reflète bien le dernier état écrit.
  const saveChainRef = useRef<Promise<unknown>>(Promise.resolve());

  const runSerialized = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const next = saveChainRef.current.then(task, task);
    saveChainRef.current = next.catch(() => undefined);
    return next;
  }, []);

  // ==========================================
  // HANDLER - Auto-save du statut (sans fermer le drawer)
  // ==========================================
  const isSavingStatusRef = useRef(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const handleAutoSaveStatus = useCallback(async (status: CheckinStatus | null) => {
    if (!reservation || !userId || !role) return;
    if (isSavingStatusRef.current) return;

    isSavingStatusRef.current = true;
    setIsSavingStatus(true);
    try {
      // Les notes courantes accompagnent le statut : envoyer `null` ici
      // effaçait en base toute note déjà saisie (bug prod sept. 2026).
      const result = await runSerialized(() => updateCheckinStatus({
        reservationId: reservation.id,
        status,
        ...notesPayload,
        userId,
        role,
        companyId,
        guestFirstName: guestForm.firstName.trim() || undefined,
        guestLastName: guestForm.lastName.trim() || undefined,
        guestEmail: guestForm.email.trim() || undefined,
        guestPhone: guestForm.phone.trim() || undefined,
        guestStructure: guestForm.structure.trim() || undefined,
      }));

      if (!result.success || !result.data) {
        toast.error(result.error || 'Erreur lors de la sauvegarde du statut');
        // Rollback : revenir au dernier statut enregistré
        setSelectedStatus(baseline?.checkinStatus ?? null);
        return;
      }

      // Notifier le parent sans fermer le drawer
      const updatedReservation = mapResultToReservationUpdate(
        reservation,
        result.data as GuestResultData,
        result.data as CheckinResultData
      );
      setSavedReservation(updatedReservation);
      onSuccess(updatedReservation);
    } catch (err) {
      logger.error('[handleAutoSaveStatus] Exception', err as Error);
      toast.error('Erreur lors de la sauvegarde du statut');
      setSelectedStatus(baseline?.checkinStatus ?? null);
    } finally {
      isSavingStatusRef.current = false;
      setIsSavingStatus(false);
    }
  }, [reservation, baseline, userId, role, companyId, guestForm, notesPayload, runSerialized, setSelectedStatus, onSuccess]);

  // ==========================================
  // HANDLER - Auto-save des notes (sans fermer le drawer)
  // ==========================================
  // Déclenché à la sortie d'un champ de notes et après une pause de frappe.
  // Ne concerne que les résas confirmées : pour une annulée, les notes passent
  // par « Enregistrer » (updateGuestInfo).
  const lastSentNotesRef = useRef<string | null>(null);

  const handleAutoSaveNotes = useCallback(async () => {
    if (!reservation || !baseline || !userId || !role || isCancelled) return;
    if (!hasNotesChanges(checkinForm, baseline)) return;

    // Évite de renvoyer un payload identique déjà en vol
    const payloadKey = JSON.stringify(notesPayload);
    if (lastSentNotesRef.current === payloadKey) return;
    lastSentNotesRef.current = payloadKey;

    try {
      const result = await runSerialized(() => updateCheckinStatus({
        reservationId: reservation.id,
        ...notesPayload,
        userId,
        role,
        companyId,
      }));

      if (!result.success || !result.data) {
        lastSentNotesRef.current = null;
        toast.error(result.error || 'Notes non enregistrées');
        return;
      }

      const updatedReservation = mapResultToReservationUpdate(
        reservation,
        result.data as GuestResultData,
        result.data as CheckinResultData
      );
      setSavedReservation(updatedReservation);
      onSuccess(updatedReservation);
    } catch (err) {
      lastSentNotesRef.current = null;
      logger.error('[handleAutoSaveNotes] Exception', err as Error);
      toast.error('Notes non enregistrées');
    }
  }, [reservation, baseline, userId, role, companyId, isCancelled, checkinForm, notesPayload, runSerialized, onSuccess]);

  // Auto-save différé pendant la frappe (couvre la fermeture par balayage,
  // qui ne déclenche pas de blur sur le champ)
  useEffect(() => {
    const timer = setTimeout(() => {
      void handleAutoSaveNotes();
    }, NOTES_AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [checkinForm.comment, checkinForm.venueNotes, checkinForm.internalNotes, handleAutoSaveNotes]);

  // Ouvre la modale de confirmation d'annulation
  const handleCancelClick = useCallback(() => {
    setCancelDialogOpen(true);
  }, []);

  // Wrapper : annule + ferme la modale UNIQUEMENT en cas de succès
  // En cas d'échec, la modale reste ouverte pour permettre de réessayer
  const handleCancelWithDialog = useCallback(async (
    notifOptions: Parameters<typeof handleCancel>[0]
  ) => {
    const success = await handleCancel(notifOptions);
    if (success) {
      setCancelDialogOpen(false);
    }
    return success;
  }, [handleCancel]);

  // ==========================================
  // EFFET - Réinitialiser quand la réservation change
  // ==========================================
  useEffect(() => {
    if (reservation) {
      resetGuestForm(reservation);
      resetCheckinForm(reservation);
      setSavedReservation(reservation);
      lastSentNotesRef.current = null;
      setDetailsOpen(false);
      setJustReactivated(false);
      setLocalStatus(reservation.status);
      setCancelDialogOpen(false);
      setReactivateNotifOptions(DEFAULT_NOTIFICATION_OPTIONS);
    }
  }, [reservation, resetGuestForm, resetCheckinForm]);

  // ==========================================
  // RETURN - Interface compatible avec index.tsx
  // ==========================================
  return {
    // États groupés
    guestForm,
    checkinForm,
    uiState: {
      isSubmitting,
      detailsOpen,
      justReactivated,
      localStatus,
    },
    
    // Setters guest
    setGuestFirstName,
    setGuestLastName,
    setGuestEmail,
    setGuestEmailSecondary,
    setGuestPhone,
    setGuestPhoneSecondary,
    setGuestStructure,
    setGuestFunction,
    setGuestAddress,
    setGuestPostalCode,
    setGuestCity,
    setGuestCountry,
    setGuestAfcNumber,
    setSpecialRequests,
    
    // Setters check-in
    setSelectedStatus,
    setComment,
    setVenueNotes,
    setInternalNotes,
    
    // Setters UI
    setDetailsOpen,
    
    // Handlers
    handleSave,
    handleReactivate,
    handleCancel: handleCancelWithDialog,
    handleAutoSaveStatus,
    handleAutoSaveNotes,
    isSavingStatus,

    // Modale de confirmation d'annulation
    cancelDialogOpen,
    setCancelDialogOpen,
    handleCancelClick,
    
    // Computed
    displayName,
    hasChanges,
    canSave: canSave && !isSubmitting,
    isCancelled,
    isAdmin,
    isStaffDD,
    canSendCheckinEmails,
    accessLoading,

    // Options de notification (réactivation uniquement)
    reactivateNotifOptions,
    setReactivateNotifOptions,
    hasCalendarEvent: !!reservation?.googleCalendarEventId,
  };
}
