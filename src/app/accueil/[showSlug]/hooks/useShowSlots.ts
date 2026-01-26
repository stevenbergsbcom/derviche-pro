/**
 * Hook useShowSlots - Gestion des slots d'un spectacle
 * Derviche Diffusion
 * 
 * Gère le chargement, filtrage et navigation des représentations
 */

'use client';

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCheckinAccess, DEFAULT_PAST_DAYS_LIMIT } from '@/hooks';
import {
  isSlotPast,
  groupSlotsByDate,
  type CheckinSlot,
} from '@/lib/services/checkin';
import type { TabFilter, UseShowSlotsReturn } from '../types';

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useShowSlots(): UseShowSlotsReturn {
  const router = useRouter();
  const params = useParams();
  const showSlug = params.showSlug as string;

  const { 
    slots, 
    isLoadingSlots, 
    slotsError, 
    loadSlots, 
    shows, 
    isAuthLoading, 
    role 
  } = useCheckinAccess();

  // ============================================
  // ÉTATS LOCAUX
  // ============================================

  const [activeTab, setActiveTab] = useState<TabFilter>('upcoming');
  const [showFullHistory, setShowFullHistory] = useState(false);

  // ============================================
  // REFS PROTECTION
  // ============================================

  /** Ref pour éviter les appels multiples */
  const loadedSlugRef = useRef<string | null>(null);
  
  /** Ref pour tracker si on a chargé l'historique complet */
  const loadedFullHistoryRef = useRef(false);
  
  /** Ref pour protection démontage */
  const isMountedRef = useRef(true);

  // ============================================
  // EFFET MONTAGE/DÉMONTAGE
  // ============================================

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================

  useEffect(() => {
    // Flag pour annuler si démontage pendant l'async
    let cancelled = false;

    const loadInitialSlots = async () => {
      if (cancelled || !isMountedRef.current) return;
      if (isAuthLoading || !role || !showSlug) return;
      if (loadedSlugRef.current === showSlug) return;

      loadedSlugRef.current = showSlug;
      loadedFullHistoryRef.current = false;
      
      if (isMountedRef.current) {
        setShowFullHistory(false);
      }

      // Chargement initial : slots à venir + 30 derniers jours passés
      await loadSlots(showSlug, { includeAllPast: false });
    };

    void loadInitialSlots();

    return () => {
      cancelled = true;
    };
    // Note: loadSlots est stable (useCallback dans useCheckinAccess)
  }, [isAuthLoading, role, showSlug, loadSlots]);

  // ============================================
  // HANDLERS
  // ============================================

  /** Refresh manuel */
  const handleRefresh = useCallback(() => {
    if (!isMountedRef.current) return;
    
    loadedSlugRef.current = null;
    // Garder l'état showFullHistory lors du refresh
    void loadSlots(showSlug, { includeAllPast: showFullHistory });
    loadedSlugRef.current = showSlug;
  }, [showSlug, loadSlots, showFullHistory]);

  /** Charger tout l'historique */
  const handleLoadFullHistory = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (loadedFullHistoryRef.current) return; // Déjà chargé
    
    setShowFullHistory(true);
    
    try {
      await loadSlots(showSlug, { includeAllPast: true });
      
      // Marquer comme chargé uniquement en cas de succès
      if (isMountedRef.current) {
        loadedFullHistoryRef.current = true;
      }
    } catch {
      // En cas d'erreur, permettre un retry
      if (isMountedRef.current) {
        setShowFullHistory(false);
      }
      // L'erreur est déjà gérée par loadSlots (setSlotsError)
    }
  }, [showSlug, loadSlots]);

  /** Navigation vers un slot */
  const handleSlotClick = useCallback(
    (slotId: string) => {
      router.push(`/accueil/${showSlug}/${slotId}`);
    },
    [router, showSlug]
  );

  // ============================================
  // DONNÉES CALCULÉES
  // ============================================

  /** Titre du spectacle */
  const showTitle = useMemo(() => {
    if (slots.length > 0) {
      return slots[0].show.title;
    }
    const foundShow = shows.find((s) => s.slug === showSlug);
    return foundShow?.title ?? 'Spectacle';
  }, [slots, shows, showSlug]);

  /** Séparer les slots en "à venir" et "passés" */
  const { upcomingSlots, pastSlots } = useMemo(() => {
    const upcoming: CheckinSlot[] = [];
    const past: CheckinSlot[] = [];

    for (const slot of slots) {
      if (isSlotPast(slot.date)) {
        past.push(slot);
      } else {
        upcoming.push(slot);
      }
    }

    // Trier les slots passés du plus récent au plus ancien
    past.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime(); // Ordre décroissant
    });

    return { upcomingSlots: upcoming, pastSlots: past };
  }, [slots]);

  /** Slots affichés selon l'onglet */
  const displayedSlots = useMemo(() => {
    return activeTab === 'upcoming' ? upcomingSlots : pastSlots;
  }, [activeTab, upcomingSlots, pastSlots]);

  /** Grouper les slots affichés par date */
  const groupedSlots = useMemo(() => {
    return groupSlotsByDate(displayedSlots);
  }, [displayedSlots]);

  /** Slots d'aujourd'hui et autres dates */
  const { todaySlots, otherDates } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySlotsArray = activeTab === 'upcoming' ? groupedSlots.get(today) : undefined;
    
    let otherDatesArray = Array.from(groupedSlots.entries()).filter(
      ([date]) => activeTab === 'past' || date !== today
    );

    // Pour l'onglet "Passés", trier les dates du plus récent au plus ancien
    if (activeTab === 'past') {
      otherDatesArray = otherDatesArray.sort((a, b) => b[0].localeCompare(a[0]));
    }

    return { 
      todaySlots: todaySlotsArray, 
      otherDates: otherDatesArray 
    };
  }, [activeTab, groupedSlots]);

  // ============================================
  // RETOUR
  // ============================================

  return {
    // États
    activeTab,
    showFullHistory,
    isLoading: isLoadingSlots,
    error: slotsError,
    
    // Données
    showTitle,
    displayedSlots,
    upcomingSlots,
    pastSlots,
    todaySlots,
    otherDates,
    hasSlots: slots.length > 0,
    
    // Handlers
    setActiveTab,
    handleRefresh,
    handleLoadFullHistory,
    handleSlotClick,
  };
}

// Ré-exporter la constante pour le composant ShowHeader
export { DEFAULT_PAST_DAYS_LIMIT };
