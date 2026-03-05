/**
 * Hook useSlotDetails - Gestion des données et handlers de la page Slot Details
 * Derviche Diffusion
 *
 * Refactorisé Session 84
 */

'use client';

import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { createClient } from '@/lib/supabase/client';
import {
  getSlotReservations,
  type CheckinReservation,
} from '@/lib/services/checkin';
import { searchMatch } from '@/lib/utils';
import { isPresent } from '@/components/accueil/StatusBadge';
import type { ReservationRowData } from '@/components/accueil';
import { logger } from '@/lib/logger';
import type { SlotInfo, UseSlotDetailsProps, UseSlotDetailsReturn } from '../types';

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard pour vérifier la structure venue
 */
function isValidVenue(venue: unknown): venue is { name: string; city: string } {
  return (
    typeof venue === 'object' &&
    venue !== null &&
    'name' in venue &&
    typeof (venue as { name: unknown }).name === 'string'
  );
}

/**
 * Type guard pour vérifier la structure show
 */
function isValidShow(show: unknown): show is { title: string; slug: string } {
  return (
    typeof show === 'object' &&
    show !== null &&
    'title' in show &&
    typeof (show as { title: unknown }).title === 'string'
  );
}

// ============================================
// HOOK PRINCIPAL
// ============================================

/**
 * Hook principal pour la page de détails d'un slot
 * Gère les états, le chargement des données, et tous les handlers
 */
export function useSlotDetails({
  slotId,
  showSlug,
}: UseSlotDetailsProps): UseSlotDetailsReturn {
  const { user, role, isLoading: isAuthLoading } = useCurrentUserRole();

  // ============================================
  // ÉTATS
  // ============================================

  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [reservations, setReservations] = useState<CheckinReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyIdError, setCompanyIdError] = useState<string | null>(null);

  // États pour le drawer de check-in
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationRowData | null>(null);

  // État pour le drawer de transfert
  const [transferDrawerOpen, setTransferDrawerOpen] = useState(false);

  // Refs pour protection race conditions
  const loadedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Cleanup au démontage
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================

  /**
   * Charge les informations du slot
   */
  const loadSlotInfo = useCallback(async (): Promise<SlotInfo | null> => {
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('slots')
        .select(`
          id,
          date,
          time,
          capacity,
          venues (
            name,
            city
          ),
          shows (
            title,
            slug
          )
        `)
        .eq('id', slotId)
        .single();

      if (fetchError || !data) {
        logger.error('useSlotDetails - Erreur chargement slot', { fetchError, slotId });
        return null;
      }

      // Utilisation des type guards pour validation
      const venue = isValidVenue(data.venues)
        ? { name: data.venues.name, city: String(data.venues.city || '') }
        : null;

      const show = isValidShow(data.shows)
        ? { title: data.shows.title, slug: String(data.shows.slug || '') }
        : null;

      return {
        id: data.id,
        date: data.date,
        time: data.time,
        capacity: data.capacity,
        venueName: venue?.name || 'Lieu inconnu',
        venueCity: venue?.city || '',
        showTitle: show?.title || 'Spectacle',
        showSlug: show?.slug || showSlug,
      };
    } catch (err) {
      logger.error('useSlotDetails - Exception chargement slot', { err, slotId });
      return null;
    }
  }, [slotId, showSlug]);

  /**
   * Charge le company_id si rôle company (avec protection race condition)
   */
  useEffect(() => {
    let cancelled = false;

    async function loadCompanyId() {
      if (!user || role !== 'company') return;

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (fetchError) {
          logger.error('useSlotDetails - Erreur chargement company_id', { fetchError, userId: user.id });
          setCompanyIdError('Impossible de charger les informations de la compagnie');
          return;
        }

        if (data?.company_id) {
          setCompanyId(data.company_id);
        } else {
          setCompanyIdError('Aucune compagnie associée à ce compte');
        }
      } catch (err) {
        if (cancelled) return;
        logger.error('useSlotDetails - Exception chargement company_id', { err, userId: user.id });
        setCompanyIdError('Erreur lors du chargement des informations');
      }
    }

    void loadCompanyId();

    return () => {
      cancelled = true;
    };
  }, [user, role]);

  /**
   * Charge toutes les données (slot + réservations) avec protection démontage
   */
  const loadData = useCallback(async () => {
    if (!user || !role || isAuthLoading) return;

    // Gestion du cas company avec erreur
    if (role === 'company') {
      if (companyIdError) {
        setError(companyIdError);
        setIsLoading(false);
        return;
      }
      if (companyId === null) return; // Attendre le chargement
    }

    setIsLoading(true);
    setError(null);

    try {
      // Charger les infos du slot
      const info = await loadSlotInfo();

      if (!isMountedRef.current) return; // Composant démonté

      if (!info) {
        setError('Représentation non trouvée');
        setIsLoading(false);
        return;
      }
      setSlotInfo(info);

      // Charger les réservations
      const result = await getSlotReservations(slotId, user.id, role, companyId);

      if (!isMountedRef.current) return; // Composant démonté

      if (result.error) {
        setError(result.error);
        setReservations([]);
      } else {
        setReservations(result.data);
      }
    } catch (err) {
      if (!isMountedRef.current) return; // Composant démonté

      logger.error('useSlotDetails - Erreur chargement données', { err, slotId });
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(`Impossible de charger les données : ${message}`);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, role, companyId, companyIdError, isAuthLoading, slotId, loadSlotInfo]);

  /**
   * Chargement initial avec protection race condition
   */
  useEffect(() => {
    if (!loadedRef.current && !isAuthLoading && user && role) {
      // Pour company, attendre companyId ou companyIdError
      if (role === 'company' && companyId === null && !companyIdError) return;
      loadedRef.current = true;
      void loadData();
    }
  }, [isAuthLoading, user, role, companyId, companyIdError, loadData]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  /**
   * Réservations filtrées selon la recherche
   */
  const filteredReservations = useMemo(() => {
    if (!searchQuery.trim()) return reservations;

    return reservations.filter((r) => {
      const searchFields = [
        r.guestFirstName,
        r.guestLastName,
        r.guestStructure,
        r.guestEmail,
      ]
        .filter(Boolean)
        .join(' ');

      return searchMatch(searchFields, searchQuery);
    });
  }, [reservations, searchQuery]);

  /**
   * Réservations confirmées (mémorisé)
   */
  const confirmedReservations = useMemo(
    () => reservations.filter((r) => r.status === 'confirmed'),
    [reservations]
  );

  /**
   * Nombre de réservations confirmées (mémorisé)
   */
  const confirmedCount = useMemo(
    () => confirmedReservations.length,
    [confirmedReservations]
  );

  /**
   * Nombre de présents (mémorisé)
   */
  const presentCount = useMemo(
    () => confirmedReservations.filter((r) => isPresent(r.checkinStatus)).length,
    [confirmedReservations]
  );

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Refresh manuel
   */
  const handleRefresh = useCallback(() => {
    loadedRef.current = false;
    void loadData();
  }, [loadData]);

  /**
   * Clic sur une réservation - ouvre le drawer
   */
  const handleReservationClick = useCallback(
    (reservation: CheckinReservation) => {
      const rowData: ReservationRowData = {
        id: reservation.id,
        guestFirstName: reservation.guestFirstName,
        guestLastName: reservation.guestLastName,
        guestStructure: reservation.guestStructure,
        guestEmail: reservation.guestEmail,
        guestEmailSecondary: reservation.guestEmailSecondary,
        guestPhone: reservation.guestPhone,
        guestPhoneSecondary: reservation.guestPhoneSecondary,
        guestFunction: reservation.guestFunction,
        guestAddress: reservation.guestAddress,
        guestPostalCode: reservation.guestPostalCode,
        guestCity: reservation.guestCity,
        guestAfcNumber: reservation.guestAfcNumber,
        numPlaces: reservation.numPlaces,
        checkinStatus: reservation.checkinStatus,
        checkinComment: reservation.checkinComment,
        checkinVenueNotes: reservation.checkinVenueNotes,
        checkinInternalNotes: reservation.checkinInternalNotes,
        specialRequests: reservation.specialRequests,
        status: reservation.status,
        googleCalendarEventId: reservation.googleCalendarEventId,
      };
      setSelectedReservation(rowData);
      setDrawerOpen(true);
    },
    []
  );

  /**
   * Succès check-in - met à jour la liste
   */
  const handleCheckinSuccess = useCallback(
    (updatedReservation: ReservationRowData) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === updatedReservation.id
            ? {
                ...r,
                // Statut de la réservation
                status: updatedReservation.status,
                // Check-in
                checkinStatus: updatedReservation.checkinStatus,
                checkinComment: updatedReservation.checkinComment ?? null,
                checkinVenueNotes: updatedReservation.checkinVenueNotes ?? null,
                checkinInternalNotes: updatedReservation.checkinInternalNotes ?? null,
                // Infos guest
                guestFirstName: updatedReservation.guestFirstName,
                guestLastName: updatedReservation.guestLastName,
                guestEmail: updatedReservation.guestEmail,
                guestEmailSecondary: updatedReservation.guestEmailSecondary ?? null,
                guestPhone: updatedReservation.guestPhone ?? null,
                guestPhoneSecondary: updatedReservation.guestPhoneSecondary ?? null,
                guestStructure: updatedReservation.guestStructure,
                guestFunction: updatedReservation.guestFunction ?? null,
                guestAddress: updatedReservation.guestAddress ?? null,
                guestPostalCode: updatedReservation.guestPostalCode ?? null,
                guestCity: updatedReservation.guestCity ?? null,
                guestAfcNumber: updatedReservation.guestAfcNumber ?? null,
                specialRequests: updatedReservation.specialRequests ?? null,
              }
            : r
        )
      );
    },
    []
  );

  /**
   * Ouvre le drawer de transfert
   */
  const handleTransferClick = useCallback(() => {
    setDrawerOpen(false);
    setTransferDrawerOpen(true);
  }, []);

  /**
   * Succès transfert - retire la réservation de la liste
   */
  const handleTransferSuccess = useCallback(
    (updatedReservation: ReservationRowData) => {
      setReservations((prev) =>
        prev.filter((r) => r.id !== updatedReservation.id)
      );
      setTransferDrawerOpen(false);
      setSelectedReservation(null);
    },
    []
  );

  // ============================================
  // RETOUR
  // ============================================

  return {
    // Données
    slotInfo,
    reservations,
    filteredReservations,

    // États
    isLoading,
    error,
    searchQuery,

    // Compteurs
    confirmedCount,
    presentCount,

    // Drawer check-in
    drawerOpen,
    selectedReservation,
    setDrawerOpen,

    // Drawer transfert
    transferDrawerOpen,
    setTransferDrawerOpen,

    // Handlers
    setSearchQuery,
    handleRefresh,
    handleReservationClick,
    handleCheckinSuccess,
    handleTransferClick,
    handleTransferSuccess,
  };
}
