/**
 * SystemeContent — Conteneur principal de la page Système
 * Derviche Diffusion
 *
 * Gère le chargement des logs et du quota Resend,
 * et orchestre les composants enfants.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { AdminPageHeader } from '@/components/admin';
import { ResendQuotaWidget }         from './resend-quota-widget';
import { RateLimitWidget }            from './rate-limit-widget';
import { LogsTable }                  from './logs-table';
import { NotificationsPurgeSection }  from './notifications-purge-section';
import { DataResetSection }           from './data-reset-section';
import type { AppLog } from '@/app/api/admin/logs/route';

// ============================================
// TYPES
// ============================================

export type LogCategory = 'all' | 'email' | 'calendar' | 'reservation' | 'system';
export type LogLevel    = 'all' | 'info' | 'warning' | 'error';
export type LogStatus   = 'all' | 'success' | 'error';

interface LogsState {
  logs: AppLog[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// COMPOSANT
// ============================================

export function SystemeContent() {
  // ── Filtres ────────────────────────────────────────────────────────────────
  const [page,     setPage]     = useState(1);
  const [category, setCategory] = useState<LogCategory>('all');
  const [level,    setLevel]    = useState<LogLevel>('all');
  const [status,   setStatus]   = useState<LogStatus>('all');

  // ── Données logs ───────────────────────────────────────────────────────────
  const [logsState, setLogsState] = useState<LogsState>({
    logs: [],
    total: 0,
    totalPages: 0,
    isLoading: true,
    error: null,
  });

  // ── Chargement logs ────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (
    currentPage: number,
    currentCategory: LogCategory,
    currentLevel: LogLevel,
    currentStatus: LogStatus,
  ) => {
    setLogsState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '50' });
      if (currentCategory !== 'all') params.set('category', currentCategory);
      if (currentLevel    !== 'all') params.set('level',    currentLevel);
      if (currentStatus   !== 'all') params.set('status',   currentStatus);

      const res  = await fetch(`/api/admin/logs?${params.toString()}`);
      const json = await res.json() as { success: boolean; data?: { logs: AppLog[]; total: number; totalPages: number }; error?: string };

      if (!json.success || !json.data) {
        setLogsState(prev => ({
          ...prev,
          isLoading: false,
          error: json.error ?? 'Erreur inconnue',
        }));
        return;
      }

      setLogsState({
        logs:       json.data.logs,
        total:      json.data.total,
        totalPages: json.data.totalPages,
        isLoading:  false,
        error:      null,
      });
    } catch {
      setLogsState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Impossible de charger les logs',
      }));
    }
  }, []);

  // Rechargement au changement de filtres ou de page
  useEffect(() => {
    void fetchLogs(page, category, level, status);
  }, [fetchLogs, page, category, level, status]);

  // Reset page à 1 quand un filtre change
  const handleCategoryChange = useCallback((val: LogCategory) => {
    setCategory(val);
    setPage(1);
  }, []);
  const handleLevelChange = useCallback((val: LogLevel) => {
    setLevel(val);
    setPage(1);
  }, []);
  const handleStatusChange = useCallback((val: LogStatus) => {
    setStatus(val);
    setPage(1);
  }, []);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Système"
        subtitle="Monitoring technique — logs et quota email"
      />

      {/* Widgets de monitoring — côte à côte sur desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResendQuotaWidget />
        <RateLimitWidget />
      </div>

      {/* Maintenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NotificationsPurgeSection />
        <DataResetSection />
      </div>

      {/* Journal des logs */}
      <LogsTable
        logs={logsState.logs}
        total={logsState.total}
        page={page}
        totalPages={logsState.totalPages}
        isLoading={logsState.isLoading}
        error={logsState.error}
        category={category}
        level={level}
        status={status}
        onPageChange={setPage}
        onCategoryChange={handleCategoryChange}
        onLevelChange={handleLevelChange}
        onStatusChange={handleStatusChange}
        onRefresh={() => void fetchLogs(page, category, level, status)}
      />
    </div>
  );
}
