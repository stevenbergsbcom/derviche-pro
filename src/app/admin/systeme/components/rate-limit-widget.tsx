/**
 * RateLimitWidget — Suivi des tentatives bloquées par le rate limiting
 * Derviche Diffusion
 *
 * Affiche :
 *   - Nombre total de requêtes bloquées aujourd'hui et sur 7 jours
 *   - Détail par route (auth, emails, reservations)
 *   - Dernière tentative bloquée (IP masquée + route)
 *   - Indicateur visuel si activité suspecte (> 10 bloquées aujourd'hui)
 *
 * Source : table app_logs, action = 'rate_limit_blocked'
 * Pas de migration nécessaire — utilise le système de logs existant.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

interface RouteStats {
  route: string;
  label: string;
  count: number;
}

interface RateLimitData {
  blockedToday:   number;
  blocked7d:      number;
  lastBlockedAt:  string | null;
  lastIdentifier: string | null;
  lastRoute:      string | null;
  byRoute:        RouteStats[];
}

// ============================================
// CONSTANTES
// ============================================

/** Seuil à partir duquel on affiche une alerte "activité suspecte" */
const ALERT_THRESHOLD = 10;

const ROUTE_LABELS: Record<string, string> = {
  '/api/auth/verify-password':      'Auth — vérif. mot de passe',
  '/api/auth/check-account-status': 'Auth — statut compte',
  '/api/emails/send-confirmation':  'Email — confirmation',
  '/api/emails/send-cancellation':  'Email — annulation',
  '/api/emails/send-modification':  'Email — modification',
  '/api/reservations':              'Réservations',
};

function labelForRoute(route: string | null): string {
  if (!route) return 'Route inconnue';
  return ROUTE_LABELS[route] ?? route;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day:    '2-digit',
    month:  '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/** Masque partiellement l'IP pour la confidentialité (ex: 192.168.1.xxx) */
function maskIp(identifier: string | null): string {
  if (!identifier) return '—';
  // Format IP:userId → prendre juste l'IP
  const ip    = identifier.split(':')[0] ?? identifier;
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  // IPv6 ou autre — tronquer
  return ip.length > 20 ? `${ip.slice(0, 20)}…` : ip;
}

/**
 * Retourne minuit UTC du jour courant en ISO string.
 * Utilise Date.UTC() pour éviter le bug timezone :
 * new Date(y, m, d) crée minuit LOCAL puis converti en UTC,
 * ce qui exclut les premières heures de la journée dans les fuseaux UTC+.
 */
function startOfTodayUTC(): string {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  )).toISOString();
}

function start7dUTC(): string {
  const now = new Date();
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

// ============================================
// COMPOSANT
// ============================================

export function RateLimitWidget() {
  const [data,      setData]      = useState<RateLimitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Flag anti setState-après-unmount
    let cancelled = false;

    try {
      const supabase   = createClient();
      const startToday = startOfTodayUTC();
      const start7d    = start7dUTC();

      // 1. Nombre bloqué aujourd'hui
      const { count: countToday, error: e1 } = await supabase
        .from('app_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'rate_limit_blocked')
        .gte('created_at', startToday);

      if (e1) throw new Error(e1.message);

      // 2. Nombre bloqué sur 7 jours
      const { count: count7d, error: e2 } = await supabase
        .from('app_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'rate_limit_blocked')
        .gte('created_at', start7d);

      if (e2) throw new Error(e2.message);

      // 3. Dernière tentative bloquée
      const { data: lastRows, error: e3 } = await supabase
        .from('app_logs')
        .select('created_at, details')
        .eq('action', 'rate_limit_blocked')
        .order('created_at', { ascending: false })
        .limit(1);

      if (e3) throw new Error(e3.message);

      const last       = lastRows?.[0] ?? null;
      const lastDetail = last?.details as Record<string, unknown> | null;

      // 4. Répartition par route sur 7 jours
      const { data: routeRows, error: e4 } = await supabase
        .from('app_logs')
        .select('details')
        .eq('action', 'rate_limit_blocked')
        .gte('created_at', start7d);

      if (e4) throw new Error(e4.message);

      // Agréger par route côté JS
      const routeCounts: Record<string, number> = {};
      for (const row of routeRows ?? []) {
        const d     = row.details as Record<string, unknown> | null;
        const route = typeof d?.route === 'string' ? d.route : 'unknown';
        routeCounts[route] = (routeCounts[route] ?? 0) + 1;
      }

      const byRoute: RouteStats[] = Object.entries(routeCounts)
        .map(([route, count]) => ({ route, label: labelForRoute(route), count }))
        .sort((a, b) => b.count - a.count);

      if (!cancelled) {
        setData({
          blockedToday:   countToday   ?? 0,
          blocked7d:      count7d      ?? 0,
          lastBlockedAt:  last?.created_at ?? null,
          lastIdentifier: typeof lastDetail?.identifier === 'string' ? lastDetail.identifier : null,
          lastRoute:      typeof lastDetail?.route      === 'string' ? lastDetail.route      : null,
          byRoute,
        });
      }
    } catch (err) {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }

    // Retourne la fonction de cleanup pour useEffect
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase   = createClient();
        const startToday = startOfTodayUTC();
        const start7d    = start7dUTC();

        const { count: countToday, error: e1 } = await supabase
          .from('app_logs')
          .select('*', { count: 'exact', head: true })
          .eq('action', 'rate_limit_blocked')
          .gte('created_at', startToday);

        if (e1) throw new Error(e1.message);

        const { count: count7d, error: e2 } = await supabase
          .from('app_logs')
          .select('*', { count: 'exact', head: true })
          .eq('action', 'rate_limit_blocked')
          .gte('created_at', start7d);

        if (e2) throw new Error(e2.message);

        const { data: lastRows, error: e3 } = await supabase
          .from('app_logs')
          .select('created_at, details')
          .eq('action', 'rate_limit_blocked')
          .order('created_at', { ascending: false })
          .limit(1);

        if (e3) throw new Error(e3.message);

        const last       = lastRows?.[0] ?? null;
        const lastDetail = last?.details as Record<string, unknown> | null;

        const { data: routeRows, error: e4 } = await supabase
          .from('app_logs')
          .select('details')
          .eq('action', 'rate_limit_blocked')
          .gte('created_at', start7d);

        if (e4) throw new Error(e4.message);

        const routeCounts: Record<string, number> = {};
        for (const row of routeRows ?? []) {
          const d     = row.details as Record<string, unknown> | null;
          const route = typeof d?.route === 'string' ? d.route : 'unknown';
          routeCounts[route] = (routeCounts[route] ?? 0) + 1;
        }

        const byRoute: RouteStats[] = Object.entries(routeCounts)
          .map(([route, count]) => ({ route, label: labelForRoute(route), count }))
          .sort((a, b) => b.count - a.count);

        if (!cancelled) {
          setData({
            blockedToday:   countToday   ?? 0,
            blocked7d:      count7d      ?? 0,
            lastBlockedAt:  last?.created_at ?? null,
            lastIdentifier: typeof lastDetail?.identifier === 'string' ? lastDetail.identifier : null,
            lastRoute:      typeof lastDetail?.route      === 'string' ? lastDetail.route      : null,
            byRoute,
          });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, []);

  // Bouton rafraîchir : même logique avec son propre flag
  const handleRefresh = useCallback(() => {
    void load();
  }, [load]);

  // ── État ─────────────────────────────────────────────────────────────────
  const isSuspicious = (data?.blockedToday ?? 0) >= ALERT_THRESHOLD;
  const hasActivity  = (data?.blocked7d    ?? 0) > 0;

  // ── Rendu ────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Shield className="size-4 text-muted-foreground" />
            Rate Limiting — Tentatives bloquées
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isLoading && data && (
              isSuspicious ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="size-3" />
                  Activité suspecte
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <CheckCircle className="size-3" />
                  Normal
                </Badge>
              )
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Rafraîchir"
            >
              <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/4 rounded bg-muted animate-pulse" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">Impossible de charger les données : {error}</p>
        ) : data ? (
          <>
            {/* Compteurs principaux */}
            <div className="grid grid-cols-2 gap-4">
              <div className={cn(
                'rounded-lg p-3 space-y-0.5',
                isSuspicious ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted/50',
              )}>
                <p className="text-xs text-muted-foreground">Aujourd&apos;hui</p>
                <p className={cn(
                  'text-2xl font-bold tabular-nums',
                  isSuspicious ? 'text-red-600 dark:text-red-400' : '',
                )}>
                  {data.blockedToday}
                </p>
                <p className="text-xs text-muted-foreground">tentatives bloquées</p>
              </div>
              <div className="rounded-lg p-3 space-y-0.5 bg-muted/50">
                <p className="text-xs text-muted-foreground">7 derniers jours</p>
                <p className="text-2xl font-bold tabular-nums">{data.blocked7d}</p>
                <p className="text-xs text-muted-foreground">tentatives bloquées</p>
              </div>
            </div>

            {/* Alerte activité suspecte */}
            {isSuspicious && (
              <div className="flex items-start gap-2 rounded-md px-3 py-2 text-sm bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <span>
                  {data.blockedToday} tentatives bloquées aujourd&apos;hui — vérifiez les logs pour détecter une attaque.
                </span>
              </div>
            )}

            {/* Dernière tentative */}
            {data.lastBlockedAt && (
              <div className="border-t pt-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Dernière tentative bloquée
                </p>
                <div className="grid grid-cols-3 gap-x-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-mono text-xs">{formatDate(data.lastBlockedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IP</p>
                    <p className="font-mono text-xs">{maskIp(data.lastIdentifier)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Route</p>
                    <p className="text-xs truncate" title={data.lastRoute ?? ''}>{labelForRoute(data.lastRoute)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Répartition par route */}
            {hasActivity && data.byRoute.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Répartition par route (7 jours)
                </p>
                <div className="space-y-1.5">
                  {data.byRoute.map(({ route, label, count }) => (
                    <div key={route} className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate flex-1" title={route}>
                        {label}
                      </p>
                      <Badge variant="secondary" className="tabular-nums shrink-0">
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aucune activité */}
            {!hasActivity && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Aucune tentative bloquée ces 7 derniers jours.
              </p>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
