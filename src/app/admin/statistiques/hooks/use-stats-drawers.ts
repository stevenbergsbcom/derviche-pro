/**
 * use-stats-drawers - Orchestration des drawers détail + sélection de summary
 * Derviche Diffusion
 *
 * Composite au-dessus de `useShowDetail` + `useVenueDetail` qui :
 *   - Mémorise le `ShowStats`/`VenueStats` sélectionné (pour afficher le header
 *     pendant la fermeture animée du drawer, et pour drawer-to-drawer).
 *   - Expose les handlers de haut niveau (openShow, openVenue, openShowFromVenue).
 *   - Gère la navigation drawer-to-drawer (venue → show) en synthétisant un
 *     `ShowStats` minimal depuis la `VenueDetailRow` si le spectacle n'est pas
 *     dans la liste principale (filtre lieu actif qui le masque).
 */

'use client';

import { useCallback, useState } from 'react';
import type {
  ShowStats,
  VenueDetailRow,
  VenueStats,
} from '@/lib/services/admin-stats';
import type { UseShowDetailReturn } from './use-show-detail';
import type { UseVenueDetailReturn } from './use-venue-detail';

// ============================================
// TYPES
// ============================================

export interface UseStatsDrawersProps {
  shows: ShowStats[];
  showDetail: UseShowDetailReturn;
  venueDetail: UseVenueDetailReturn;
}

export interface UseStatsDrawersReturn {
  selectedShow: ShowStats | null;
  selectedVenue: VenueStats | null;
  openShow: (row: ShowStats) => void;
  openVenue: (row: VenueStats) => void;
  openShowFromVenue: (showId: string) => void;
}

// ============================================
// HELPERS
// ============================================

function venueRowToShowStats(row: VenueDetailRow): ShowStats {
  return {
    showId: row.showId,
    showTitle: row.showTitle,
    showSlug: row.showSlug,
    companyId: null,
    companyName: row.companyName,
    representationsCount: row.representationsCount,
    confirmedCount: row.confirmedCount,
    cancelledCount: 0,
    presentCount: row.presentCount,
    absentCount: row.absentCount,
    pressCount: row.pressCount,
  };
}

// ============================================
// HOOK
// ============================================

export function useStatsDrawers({
  shows,
  showDetail,
  venueDetail,
}: UseStatsDrawersProps): UseStatsDrawersReturn {
  const [selectedShow, setSelectedShow] = useState<ShowStats | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<VenueStats | null>(null);

  const openShow = useCallback(
    (row: ShowStats) => {
      setSelectedShow(row);
      showDetail.open(row.showId);
    },
    [showDetail]
  );

  const openVenue = useCallback(
    (row: VenueStats) => {
      setSelectedVenue(row);
      venueDetail.open(row.venueId);
    },
    [venueDetail]
  );

  const openShowFromVenue = useCallback(
    (showId: string) => {
      const fromList = shows.find((s) => s.showId === showId);
      const fromVenue = venueDetail.data.find((r) => r.showId === showId);
      const summary = fromList ?? (fromVenue ? venueRowToShowStats(fromVenue) : null);
      if (!summary) return;

      venueDetail.close();
      setSelectedShow(summary);
      showDetail.open(showId);
    },
    [shows, showDetail, venueDetail]
  );

  return {
    selectedShow,
    selectedVenue,
    openShow,
    openVenue,
    openShowFromVenue,
  };
}
