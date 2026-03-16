/**
 * Hook de chargement des données de la fiche professionnel
 * Gère le profil et l'historique des réservations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { Professional } from '@/lib/services/professionals';
import type { ProfessionalReservationHistoryEntry } from '@/app/api/admin/professionals/[professionalId]/history/route';

interface UseProfessionalDetailReturn {
  /** Données du professionnel */
  professional: Professional | null;
  /** Indique si le profil est en cours de chargement */
  isLoadingPro: boolean;
  /** Message d'erreur du chargement profil */
  errorPro: string | null;
  /** Historique des réservations */
  history: ProfessionalReservationHistoryEntry[];
  /** Indique si l'historique est en cours de chargement */
  isLoadingHistory: boolean;
  /** Message d'erreur du chargement historique */
  errorHistory: string | null;
  /** Recharge l'historique des réservations */
  refreshHistory: () => void;
}

/** Hook de chargement du profil et de l'historique d'un professionnel */
export function useProfessionalDetail(professionalId: string): UseProfessionalDetailReturn {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [isLoadingPro, setIsLoadingPro] = useState(true);
  const [errorPro, setErrorPro] = useState<string | null>(null);

  const [history, setHistory] = useState<ProfessionalReservationHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);

  // ---- Chargement du profil ----
  const loadProfessional = useCallback(async () => {
    setIsLoadingPro(true);
    setErrorPro(null);

    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, email, first_name, last_name,
        phone, email2, phone2, function, structure,
        afc_number, address, postal_code, city, country,
        comments, gdpr_consent, created_at, last_login_at,
        disabled_at
      `)
      .eq('id', professionalId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      logger.error('ProfessionalDetailPage: profil non trouvé', {
        professionalId,
        error: error?.message,
      });
      setErrorPro('Professionnel introuvable');
      setIsLoadingPro(false);
      return;
    }

    const { count: reservationCount } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', professionalId);

    setProfessional({ ...data, reservation_count: reservationCount ?? 0 } as Professional);
    setIsLoadingPro(false);
  }, [professionalId]);

  // ---- Chargement de l'historique ----
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    setErrorHistory(null);

    try {
      const response = await fetch(
        `/api/admin/professionals/${professionalId}/history`
      );
      const result = (await response.json()) as {
        success: boolean;
        data?: ProfessionalReservationHistoryEntry[];
        error?: string;
      };

      if (!result.success) {
        setErrorHistory(result.error ?? 'Erreur lors du chargement');
      } else {
        setHistory(result.data ?? []);
      }
    } catch {
      setErrorHistory('Erreur réseau');
    }

    setIsLoadingHistory(false);
  }, [professionalId]);

  useEffect(() => {
    void loadProfessional();
    void loadHistory();
  }, [loadProfessional, loadHistory]);

  const refreshHistory = useCallback(() => {
    void loadHistory();
  }, [loadHistory]);

  return {
    professional,
    isLoadingPro,
    errorPro,
    history,
    isLoadingHistory,
    errorHistory,
    refreshHistory,
  };
}
