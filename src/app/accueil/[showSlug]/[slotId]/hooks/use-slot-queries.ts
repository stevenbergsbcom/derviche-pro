/**
 * Hook use-slot-queries - Data fetching, loading, polling/refresh
 * Derviche Diffusion
 *
 * Extracted from useSlotDetails (Session refactoring)
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
import { logger } from '@/lib/logger';
import type { SlotInfo, UseSlotDetailsProps } from '../types';

// ============================================
// TYPE GUARDS
// ============================================

function isValidVenue(venue: unknown): venue is { name: string; city: string } {
  return (
    typeof venue === 'object' &&
    venue !== null &&
    'name' in venue &&
    typeof (venue as { name: unknown }).name === 'string'
  );
}

function isValidShow(show: unknown): show is { title: string; slug: string } {
  return (
    typeof show === 'object' &&
    show !== null &&
    'title' in show &&
    typeof (show as { title: unknown }).title === 'string'
  );
}

// ============================================
// RETURN TYPE
// ============================================

export interface UseSlotQueriesReturn {
  // Auth
  user: ReturnType<typeof useCurrentUserRole>['user'];
  role: ReturnType<typeof useCurrentUserRole>['role'];

  // Data
  slotInfo: SlotInfo | null;
  reservations: CheckinReservation[];
  filteredReservations: CheckinReservation[];
  setReservations: React.Dispatch<React.SetStateAction<CheckinReservation[]>>;

  // States
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Computed
  confirmedCount: number;
  presentCount: number;

  // Refresh
  handleRefresh: () => void;

  // Refs
  isMountedRef: React.RefObject<boolean>;
}

// ============================================
// HOOK
// ============================================

export function useSlotQueries({
  slotId,
  showSlug,
}: UseSlotDetailsProps): UseSlotQueriesReturn {
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
   * Charge le company_id si rôle company
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
    return () => { cancelled = true; };
  }, [user, role]);

  const loadData = useCallback(async () => {
    if (!user || !role || isAuthLoading) return;

    if (role === 'company') {
      if (companyIdError) {
        setError(companyIdError);
        setIsLoading(false);
        return;
      }
      if (companyId === null) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const info = await loadSlotInfo();
      if (!isMountedRef.current) return;

      if (!info) {
        setError('Représentation non trouvée');
        setIsLoading(false);
        return;
      }
      setSlotInfo(info);

      const result = await getSlotReservations(slotId, user.id, role, companyId);
      if (!isMountedRef.current) return;

      if (result.error) {
        setError(result.error);
        setReservations([]);
      } else {
        setReservations(result.data);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      logger.error('useSlotDetails - Erreur chargement données', { err, slotId });
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(`Impossible de charger les données : ${message}`);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, role, companyId, companyIdError, isAuthLoading, slotId, loadSlotInfo]);

  useEffect(() => {
    if (!loadedRef.current && !isAuthLoading && user && role) {
      if (role === 'company' && companyId === null && !companyIdError) return;
      loadedRef.current = true;
      void loadData();
    }
  }, [isAuthLoading, user, role, companyId, companyIdError, loadData]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

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

  const confirmedReservations = useMemo(
    () => reservations.filter((r) => r.status === 'confirmed'),
    [reservations]
  );

  const confirmedCount = useMemo(
    () => confirmedReservations.length,
    [confirmedReservations]
  );

  const presentCount = useMemo(
    () => confirmedReservations.filter((r) => isPresent(r.checkinStatus)).length,
    [confirmedReservations]
  );

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = useCallback(() => {
    loadedRef.current = false;
    void loadData();
  }, [loadData]);

  // ============================================
  // RETOUR
  // ============================================

  return {
    user,
    role,
    slotInfo,
    reservations,
    filteredReservations,
    setReservations,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    confirmedCount,
    presentCount,
    handleRefresh,
    isMountedRef,
  };
}
