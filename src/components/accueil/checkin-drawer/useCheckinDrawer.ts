/**
 * Hook useCheckinDrawer - Logique du drawer de pointage
 * Derviche Diffusion
 * 
 * Gère :
 * - Les états du formulaire guest (13 champs)
 * - Les états du check-in (statut, commentaires, notes)
 * - Les états UI (submitting, details open, etc.)
 * - Les handlers (save, reactivate, cancel)
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { 
  updateCheckinStatus, 
  updateGuestInfo, 
  reactivateReservation, 
  cancelReservationFromPWA 
} from '@/lib/services/checkin';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import type { CheckinStatus } from '@/types/database';
import type { ReservationRowData } from '../ReservationRow';
import type { UseCheckinDrawerReturn } from './types';
import { getFullName, STATUS_BUTTONS } from './constants';

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
  const { userId, role, companyId, isAdmin, isLoading: accessLoading } = useCheckinAccess();
  
  // ==========================================
  // ÉTATS - Check-in
  // ==========================================
  const [selectedStatus, setSelectedStatus] = useState<CheckinStatus | null>(null);
  const [comment, setComment] = useState('');
  const [venueNotes, setVenueNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  
  // ==========================================
  // ÉTATS - Infos guest (13 champs)
  // ==========================================
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestEmailSecondary, setGuestEmailSecondary] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestPhoneSecondary, setGuestPhoneSecondary] = useState('');
  const [guestStructure, setGuestStructure] = useState('');
  const [guestFunction, setGuestFunction] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [guestPostalCode, setGuestPostalCode] = useState('');
  const [guestCity, setGuestCity] = useState('');
  const [guestAfcNumber, setGuestAfcNumber] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  // ==========================================
  // ÉTATS - UI
  // ==========================================
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [justReactivated, setJustReactivated] = useState(false);
  const [localStatus, setLocalStatus] = useState<'confirmed' | 'cancelled' | 'no_show'>('confirmed');

  // ==========================================
  // EFFET - Réinitialiser quand la réservation change
  // ==========================================
  useEffect(() => {
    if (reservation) {
      // Check-in
      setSelectedStatus(reservation.checkinStatus);
      setComment(reservation.checkinComment || '');
      setVenueNotes(reservation.checkinVenueNotes || '');
      setInternalNotes(reservation.checkinInternalNotes || '');
      // Infos guest
      setGuestFirstName(reservation.guestFirstName || '');
      setGuestLastName(reservation.guestLastName || '');
      setGuestEmail(reservation.guestEmail || '');
      setGuestEmailSecondary(reservation.guestEmailSecondary || '');
      setGuestPhone(reservation.guestPhone || '');
      setGuestPhoneSecondary(reservation.guestPhoneSecondary || '');
      setGuestStructure(reservation.guestStructure || '');
      setGuestFunction(reservation.guestFunction || '');
      setGuestAddress(reservation.guestAddress || '');
      setGuestPostalCode(reservation.guestPostalCode || '');
      setGuestCity(reservation.guestCity || '');
      setGuestAfcNumber(reservation.guestAfcNumber || '');
      setSpecialRequests(reservation.specialRequests || '');
      // UI
      setDetailsOpen(false);
      setJustReactivated(false);
      setLocalStatus(reservation.status);
    }
  }, [reservation]);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  
  const isCancelled = localStatus === 'cancelled';
  
  const displayName = getFullName(guestFirstName, guestLastName);
  
  const hasChanges = useMemo(() => {
    if (!reservation) return false;
    
    return (
      // Check-in
      selectedStatus !== reservation.checkinStatus ||
      comment !== (reservation.checkinComment || '') ||
      venueNotes !== (reservation.checkinVenueNotes || '') ||
      (isAdmin && internalNotes !== (reservation.checkinInternalNotes || '')) ||
      // Infos guest
      guestFirstName !== (reservation.guestFirstName || '') ||
      guestLastName !== (reservation.guestLastName || '') ||
      guestEmail !== (reservation.guestEmail || '') ||
      guestEmailSecondary !== (reservation.guestEmailSecondary || '') ||
      guestPhone !== (reservation.guestPhone || '') ||
      guestPhoneSecondary !== (reservation.guestPhoneSecondary || '') ||
      guestStructure !== (reservation.guestStructure || '') ||
      guestFunction !== (reservation.guestFunction || '') ||
      guestAddress !== (reservation.guestAddress || '') ||
      guestPostalCode !== (reservation.guestPostalCode || '') ||
      guestCity !== (reservation.guestCity || '') ||
      guestAfcNumber !== (reservation.guestAfcNumber || '') ||
      specialRequests !== (reservation.specialRequests || '')
    );
  }, [
    reservation,
    selectedStatus,
    comment,
    venueNotes,
    internalNotes,
    isAdmin,
    guestFirstName,
    guestLastName,
    guestEmail,
    guestEmailSecondary,
    guestPhone,
    guestPhoneSecondary,
    guestStructure,
    guestFunction,
    guestAddress,
    guestPostalCode,
    guestCity,
    guestAfcNumber,
    specialRequests,
  ]);

  const isResettingStatus = selectedStatus === null && reservation?.checkinStatus !== null;
  const canSave = (selectedStatus !== null || isResettingStatus || hasChanges) && !isSubmitting && !accessLoading;

  // ==========================================
  // HANDLER - Sauvegarde
  // ==========================================
  const handleSave = useCallback(async () => {
    if (!reservation || !userId || !role) {
      toast.error('Données manquantes pour la sauvegarde');
      return;
    }

    // Validation basique
    if (!guestFirstName.trim() || !guestLastName.trim()) {
      toast.error('Le prénom et le nom sont obligatoires');
      return;
    }
    if (!guestEmail.trim()) {
      toast.error('L\'email est obligatoire');
      return;
    }

    setIsSubmitting(true);

    try {
      // Si annulée, utiliser updateGuestInfo (pas de check-in possible)
      if (isCancelled) {
        const result = await updateGuestInfo({
          reservationId: reservation.id,
          userId,
          role,
          companyId,
          // Champs guest
          guestFirstName: guestFirstName.trim(),
          guestLastName: guestLastName.trim(),
          guestEmail: guestEmail.trim(),
          guestEmailSecondary: guestEmailSecondary.trim() || null,
          guestPhone: guestPhone.trim() || null,
          guestPhoneSecondary: guestPhoneSecondary.trim() || null,
          guestStructure: guestStructure.trim() || null,
          guestFunction: guestFunction.trim() || null,
          guestAddress: guestAddress.trim() || null,
          guestPostalCode: guestPostalCode.trim() || null,
          guestCity: guestCity.trim() || null,
          guestAfcNumber: guestAfcNumber.trim() || null,
          specialRequests: specialRequests.trim() || null,
          // Notes
          checkinComment: comment.trim() || null,
          checkinVenueNotes: venueNotes.trim() || null,
          checkinInternalNotes: isAdmin ? (internalNotes.trim() || null) : undefined,
        });

        if (!result.success || !result.data) {
          toast.error(result.error || 'Erreur lors de la mise à jour');
          return;
        }

        toast.success(`${getFullName(result.data.guestFirstName, result.data.guestLastName)} : Informations mises à jour`);

        // Callback avec les données mises à jour
        onSuccess({
          ...reservation,
          status: result.data.status,
          checkinStatus: result.data.checkinStatus,
          checkinComment: result.data.checkinComment,
          checkinVenueNotes: result.data.checkinVenueNotes,
          checkinInternalNotes: result.data.checkinInternalNotes,
          guestFirstName: result.data.guestFirstName,
          guestLastName: result.data.guestLastName,
          guestEmail: result.data.guestEmail,
          guestEmailSecondary: result.data.guestEmailSecondary,
          guestPhone: result.data.guestPhone,
          guestPhoneSecondary: result.data.guestPhoneSecondary,
          guestStructure: result.data.guestStructure,
          guestFunction: result.data.guestFunction,
          guestAddress: result.data.guestAddress,
          guestPostalCode: result.data.guestPostalCode,
          guestCity: result.data.guestCity,
          guestAfcNumber: result.data.guestAfcNumber,
          specialRequests: result.data.specialRequests,
        });

        onOpenChange(false);
      } else {
        // Réservation confirmée : utiliser updateCheckinStatus
        const result = await updateCheckinStatus({
          reservationId: reservation.id,
          status: selectedStatus,
          comment: comment.trim() || null,
          venueNotes: venueNotes.trim() || null,
          internalNotes: isAdmin ? (internalNotes.trim() || null) : undefined,
          userId,
          role,
          companyId,
          // Champs guest
          guestFirstName: guestFirstName.trim(),
          guestLastName: guestLastName.trim(),
          guestEmail: guestEmail.trim(),
          guestEmailSecondary: guestEmailSecondary.trim() || null,
          guestPhone: guestPhone.trim() || null,
          guestPhoneSecondary: guestPhoneSecondary.trim() || null,
          guestStructure: guestStructure.trim() || null,
          guestFunction: guestFunction.trim() || null,
          guestAddress: guestAddress.trim() || null,
          guestPostalCode: guestPostalCode.trim() || null,
          guestCity: guestCity.trim() || null,
          guestAfcNumber: guestAfcNumber.trim() || null,
          specialRequests: specialRequests.trim() || null,
        });

        if (!result.success || !result.data) {
          toast.error(result.error || 'Erreur lors du pointage');
          return;
        }

        // Succès - message adapté selon l'action
        const guestName = getFullName(result.data.guestFirstName, result.data.guestLastName);
        
        if (selectedStatus === null && reservation.checkinStatus !== null) {
          toast.success(`${guestName} : Statut réinitialisé (non pointé)`);
        } else if (selectedStatus) {
          const statusLabel = STATUS_BUTTONS.find(b => b.status === selectedStatus)?.label || 'Pointé';
          toast.success(`${guestName} : ${statusLabel}`);
        } else {
          toast.success(`${guestName} : Informations mises à jour`);
        }

        // Callback avec les données mises à jour
        onSuccess({
          ...reservation,
          status: result.data.status,
          checkinStatus: result.data.checkinStatus,
          checkinComment: result.data.checkinComment,
          checkinVenueNotes: result.data.checkinVenueNotes,
          checkinInternalNotes: result.data.checkinInternalNotes,
          guestFirstName: result.data.guestFirstName,
          guestLastName: result.data.guestLastName,
          guestEmail: result.data.guestEmail,
          guestEmailSecondary: result.data.guestEmailSecondary,
          guestPhone: result.data.guestPhone,
          guestPhoneSecondary: result.data.guestPhoneSecondary,
          guestStructure: result.data.guestStructure,
          guestFunction: result.data.guestFunction,
          guestAddress: result.data.guestAddress,
          guestPostalCode: result.data.guestPostalCode,
          guestCity: result.data.guestCity,
          guestAfcNumber: result.data.guestAfcNumber,
          specialRequests: result.data.specialRequests,
        });

        onOpenChange(false);
      }
    } catch (error) {
      logger.error('useCheckinDrawer - Erreur sauvegarde', error as Error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    reservation,
    selectedStatus,
    comment,
    venueNotes,
    internalNotes,
    isAdmin,
    userId,
    role,
    companyId,
    guestFirstName,
    guestLastName,
    guestEmail,
    guestEmailSecondary,
    guestPhone,
    guestPhoneSecondary,
    guestStructure,
    guestFunction,
    guestAddress,
    guestPostalCode,
    guestCity,
    guestAfcNumber,
    specialRequests,
    isCancelled,
    onSuccess,
    onOpenChange,
  ]);

  // ==========================================
  // HANDLER - Réactivation
  // ==========================================
  const handleReactivate = useCallback(async () => {
    if (!reservation || !userId || !role) {
      toast.error('Données manquantes pour la réactivation');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await reactivateReservation({
        reservationId: reservation.id,
        userId,
        role,
        companyId,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || 'Erreur lors de la réactivation');
        return;
      }

      const guestName = getFullName(
        result.data.reservation.guestFirstName,
        result.data.reservation.guestLastName
      );

      if (result.data.isOverbooking) {
        toast.warning(`${guestName} : Réservation réactivée (attention: overbooking)`);
      } else {
        toast.success(`${guestName} : Réservation réactivée`);
      }

      // Mettre à jour l'état local pour afficher les boutons de statut
      setLocalStatus('confirmed');
      setJustReactivated(true);

      // NE PAS fermer le drawer pour permettre le check-in immédiat
      onSuccess({
        ...reservation,
        status: 'confirmed',
        checkinStatus: result.data.reservation.checkinStatus,
        checkinComment: result.data.reservation.checkinComment,
        checkinVenueNotes: result.data.reservation.checkinVenueNotes,
        checkinInternalNotes: result.data.reservation.checkinInternalNotes,
        guestFirstName: result.data.reservation.guestFirstName,
        guestLastName: result.data.reservation.guestLastName,
        guestEmail: result.data.reservation.guestEmail,
        guestEmailSecondary: result.data.reservation.guestEmailSecondary,
        guestPhone: result.data.reservation.guestPhone,
        guestPhoneSecondary: result.data.reservation.guestPhoneSecondary,
        guestStructure: result.data.reservation.guestStructure,
        guestFunction: result.data.reservation.guestFunction,
        guestAddress: result.data.reservation.guestAddress,
        guestPostalCode: result.data.reservation.guestPostalCode,
        guestCity: result.data.reservation.guestCity,
        guestAfcNumber: result.data.reservation.guestAfcNumber,
        specialRequests: result.data.reservation.specialRequests,
      });
    } catch (error) {
      logger.error('useCheckinDrawer - Erreur réactivation', error as Error);
      toast.error('Erreur lors de la réactivation');
    } finally {
      setIsSubmitting(false);
    }
  }, [reservation, userId, role, companyId, onSuccess]);

  // ==========================================
  // HANDLER - Annulation
  // ==========================================
  const handleCancel = useCallback(async () => {
    if (!reservation || !userId || !role) {
      toast.error('Données manquantes pour l\'annulation');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await cancelReservationFromPWA({
        reservationId: reservation.id,
        userId,
        role,
        companyId,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || 'Erreur lors de l\'annulation');
        return;
      }

      const guestName = getFullName(
        result.data.guestFirstName,
        result.data.guestLastName
      );

      toast.success(`${guestName} : Réservation annulée`);

      // Mettre à jour l'état local
      setLocalStatus('cancelled');
      setSelectedStatus(null);

      // Notifier le parent
      onSuccess({
        ...reservation,
        status: 'cancelled',
        checkinStatus: result.data.checkinStatus,
        checkinComment: result.data.checkinComment,
        checkinVenueNotes: result.data.checkinVenueNotes,
        checkinInternalNotes: result.data.checkinInternalNotes,
        guestFirstName: result.data.guestFirstName,
        guestLastName: result.data.guestLastName,
        guestEmail: result.data.guestEmail,
        guestEmailSecondary: result.data.guestEmailSecondary,
        guestPhone: result.data.guestPhone,
        guestPhoneSecondary: result.data.guestPhoneSecondary,
        guestStructure: result.data.guestStructure,
        guestFunction: result.data.guestFunction,
        guestAddress: result.data.guestAddress,
        guestPostalCode: result.data.guestPostalCode,
        guestCity: result.data.guestCity,
        guestAfcNumber: result.data.guestAfcNumber,
        specialRequests: result.data.specialRequests,
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('useCheckinDrawer - Erreur annulation', error as Error);
      toast.error('Erreur lors de l\'annulation');
    } finally {
      setIsSubmitting(false);
    }
  }, [reservation, userId, role, companyId, onSuccess, onOpenChange]);

  // ==========================================
  // RETURN
  // ==========================================
  return {
    // États groupés
    guestForm: {
      firstName: guestFirstName,
      lastName: guestLastName,
      email: guestEmail,
      emailSecondary: guestEmailSecondary,
      phone: guestPhone,
      phoneSecondary: guestPhoneSecondary,
      structure: guestStructure,
      function: guestFunction,
      address: guestAddress,
      postalCode: guestPostalCode,
      city: guestCity,
      afcNumber: guestAfcNumber,
      specialRequests,
    },
    checkinForm: {
      selectedStatus,
      comment,
      venueNotes,
      internalNotes,
    },
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
    handleCancel,
    
    // Computed
    displayName,
    hasChanges,
    canSave,
    isCancelled,
    isAdmin,
    accessLoading,
  };
}
