/**
 * Hook useNotifications
 * Derviche Diffusion
 *
 * Gère le chargement et les mutations des notifications admin.
 * - Polling toutes les 30s pour le badge non-lu
 * - Chargement paginé à la demande (Sheet)
 * - Mutations : marquer lu / tout marquer lu
 *
 * Patterns :
 * - useState/useEffect (pas de React Query — cohérent avec le reste du projet)
 * - useRef pour éviter les race conditions
 * - isMounted pour éviter les setState après démontage
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AdminNotification, GetNotificationsResult } from '@/lib/services/notifications';

// ============================================
// CONSTANTES
// ============================================

const POLL_INTERVAL_MS = 30_000; // 30 secondes
const PAGE_LIMIT = 20;

// ============================================
// TYPES
// ============================================

export interface UseNotificationsReturn {
  /** Nombre de notifications non lues (pour le badge) */
  unreadCount: number;
  /** Liste des notifications chargées */
  notifications: AdminNotification[];
  /** Total de notifications en base */
  total: number;
  /** Page courante */
  page: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Chargement initial ou changement de page */
  isLoading: boolean;
  /** Chargement du badge en cours */
  isBadgeLoading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Charger / recharger les notifications (ouvre le Sheet) */
  loadNotifications: (pageNum?: number) => Promise<void>;
  /** Marquer une notification lue */
  markAsRead: (id: string) => Promise<void>;
  /** Tout marquer lu */
  markAllAsRead: () => Promise<void>;
  /** Aller à une page */
  goToPage: (pageNum: number) => void;
  /** Rafraîchir le badge manuellement */
  refreshBadge: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

export function useNotifications(): UseNotificationsReturn {
  const [unreadCount, setUnreadCount]     = useState(0);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [total, setTotal]                 = useState(0);
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(0);
  const [isLoading, setIsLoading]         = useState(false);
  const [isBadgeLoading, setIsBadgeLoading] = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const isMountedRef   = useRef(true);
  const isLoadingRef   = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch badge (unread count seulement — léger) ─────────────────────────

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications?page=1&limit=1');
      if (!res.ok) return;

      const json = (await res.json()) as {
        success: boolean;
        data?: GetNotificationsResult;
      };

      if (isMountedRef.current && json.success && json.data) {
        setUnreadCount(json.data.unreadCount);
        setIsBadgeLoading(false);
      }
    } catch {
      // Non-bloquant : le badge reste à sa dernière valeur connue
      if (isMountedRef.current) setIsBadgeLoading(false);
    }
  }, []);

  // ── Fetch liste paginée ───────────────────────────────────────────────────

  const loadNotifications = useCallback(async (pageNum = 1) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const res = await fetch(
        `/api/admin/notifications?page=${pageNum}&limit=${PAGE_LIMIT}`
      );

      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

      const json = (await res.json()) as {
        success: boolean;
        data?: GetNotificationsResult;
        error?: string;
      };

      if (!isMountedRef.current) return;

      if (!json.success || !json.data) {
        setError(json.error ?? 'Erreur lors du chargement');
        return;
      }

      setNotifications(json.data.notifications);
      setTotal(json.data.total);
      setPage(json.data.page);
      setTotalPages(json.data.totalPages);
      setUnreadCount(json.data.unreadCount);
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur réseau');
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // ── Pagination ────────────────────────────────────────────────────────────

  const goToPage = useCallback(
    (pageNum: number) => {
      void loadNotifications(pageNum);
    },
    [loadNotifications]
  );

  // ── Marquer une notif lue ─────────────────────────────────────────────────

  const markAsRead = useCallback(async (id: string) => {
    // Mise à jour optimiste : is_read = true immédiatement
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/admin/notifications/${id}/read`, { method: 'POST' });
    } catch {
      // Non-bloquant : l'UI reste dans l'état optimiste
    }
  }, []);

  // ── Tout marquer lu ───────────────────────────────────────────────────────

  const markAllAsRead = useCallback(async () => {
    // Mise à jour optimiste
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/admin/notifications/read-all', { method: 'POST' });
    } catch {
      // Non-bloquant
    }
  }, []);

  // ── Polling badge (30s) ───────────────────────────────────────────────────

  const refreshBadge = useCallback(async () => {
    await fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    isMountedRef.current = true;

    // Chargement initial du badge
    void fetchUnreadCount();

    // Polling
    pollIntervalRef.current = setInterval(() => {
      void fetchUnreadCount();
    }, POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    notifications,
    total,
    page,
    totalPages,
    isLoading,
    isBadgeLoading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    goToPage,
    refreshBadge,
  };
}
