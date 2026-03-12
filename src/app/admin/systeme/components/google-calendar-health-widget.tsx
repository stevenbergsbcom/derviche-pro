/**
 * GoogleCalendarHealthWidget — Suivi santé du token Google Calendar
 * Derviche Diffusion
 *
 * Affiche :
 *   - Statut courant du token (Valide / Invalide / Inconnu)
 *   - Date de dernière vérification
 *   - Message d'erreur détaillé si le token est invalide
 *   - Bouton "Vérifier maintenant" pour forcer un check manuel
 *
 * Pattern identique à ResendQuotaWidget : self-contained,
 * fetch direct via Supabase client + appel API admin.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, RefreshCw, AlertTriangle, CheckCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

type TokenStatus = 'valid' | 'invalid' | 'unknown';

interface HealthData {
  status: TokenStatus;
  lastCheck: string; // ISO timestamp ou 'never'
}

interface HealthApiResponse {
  success: boolean;
  data?: {
    status: 'valid' | 'invalid' | 'error';
    checkedAt: string;
    accessTokenExpiry?: string;
    errorMessage?: string;
  };
  error?: string;
}

// ============================================
// HELPERS
// ============================================

function normalizeStatus(raw: unknown): TokenStatus {
  if (typeof raw !== 'string') return 'unknown';
  const clean = raw.replace(/^"|"$/g, '');
  if (clean === 'valid') return 'valid';
  if (clean === 'invalid') return 'invalid';
  return 'unknown';
}

function normalizeLastCheck(raw: unknown): string {
  if (typeof raw !== 'string') return 'never';
  return raw.replace(/^"|"$/g, '');
}

function formatLastCheck(value: string): string {
  if (value === 'never') return 'Jamais';
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'Jamais';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusConfig(status: TokenStatus) {
  switch (status) {
    case 'valid':
      return {
        label: 'Valide',
        variant: 'default' as const,
        className: 'bg-emerald-500 hover:bg-emerald-500/80',
        icon: CheckCircle,
        iconColor: 'text-emerald-500',
      };
    case 'invalid':
      return {
        label: 'Invalide',
        variant: 'destructive' as const,
        className: '',
        icon: AlertTriangle,
        iconColor: 'text-red-500',
      };
    default:
      return {
        label: 'Inconnu',
        variant: 'secondary' as const,
        className: '',
        icon: HelpCircle,
        iconColor: 'text-muted-foreground',
      };
  }
}

// ============================================
// COMPOSANT
// ============================================

export function GoogleCalendarHealthWidget() {
  const [data,       setData]       = useState<HealthData | null>(null);
  const [loadError,  setLoadError]  = useState<string | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  // ── Chargement depuis app_settings ────────────────────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const supabase = createClient();

      const { data: settings, error: settingsErr } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['google_calendar_token_status', 'google_calendar_last_health_check']);

      if (settingsErr) throw new Error(settingsErr.message);

      const status = normalizeStatus(
        settings?.find(s => s.key === 'google_calendar_token_status')?.value,
      );
      const lastCheck = normalizeLastCheck(
        settings?.find(s => s.key === 'google_calendar_last_health_check')?.value,
      );

      setData({ status, lastCheck });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Toast après callback OAuth Google ─────────────────────────────────────
  const searchParams = useSearchParams();

  useEffect(() => {
    const googleAuth = searchParams.get('google_auth');
    if (!googleAuth) return;

    // Afficher le toast selon le résultat
    if (googleAuth === 'success') {
      toast.success('Autorisation Google Calendar réussie — le token a été renouvelé.');
      void load(); // Recharger pour afficher le nouveau statut
    } else if (googleAuth === 'denied') {
      toast.error('Autorisation refusée — le consentement Google a été annulé.');
    } else if (googleAuth === 'error') {
      const reason = searchParams.get('reason') ?? 'inconnue';
      toast.error(`Erreur lors de l'autorisation Google (${reason}).`);
    }

    // Nettoyer l'URL pour ne pas réafficher le toast au refresh
    const url = new URL(window.location.href);
    url.searchParams.delete('google_auth');
    url.searchParams.delete('reason');
    window.history.replaceState({}, '', url.toString());
  }, [searchParams, load]);

  // ── Vérification manuelle ─────────────────────────────────────────────────
  const checkNow = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/admin/google-calendar/health', { method: 'POST' });
      const json = (await res.json()) as HealthApiResponse;

      if (!res.ok || !json.success) {
        const errMsg = json.error ?? `Erreur HTTP ${res.status}`;
        toast.error(`Vérification échouée : ${errMsg}`);
        return;
      }

      if (json.data?.status === 'valid') {
        toast.success('Token Google Calendar valide');
      } else {
        toast.warning(
          `Token invalide : ${json.data?.errorMessage ?? 'erreur inconnue'}`,
        );
      }

      // Recharger les données depuis app_settings
      void load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Erreur réseau : ${msg}`);
    } finally {
      setIsChecking(false);
    }
  }, [load]);

  // ── Rendu ─────────────────────────────────────────────────────────────────
  const statusConfig = data ? getStatusConfig(data.status) : getStatusConfig('unknown');
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Calendar className="size-4 text-muted-foreground" />
            Google Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Badge statut */}
            <Badge variant={statusConfig.variant} className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
            {/* Rafraîchir */}
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => void load()}
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
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
          </div>
        ) : loadError ? (
          <p className="text-sm text-red-600">
            Impossible de charger les données : {loadError}
          </p>
        ) : data ? (
          <>
            {/* Statut avec icône */}
            <div className="flex items-center gap-2">
              <StatusIcon className={cn('size-5', statusConfig.iconColor)} />
              <div>
                <p className="text-sm font-medium">
                  {data.status === 'valid' && 'Le token OAuth2 est valide'}
                  {data.status === 'invalid' && 'Le token OAuth2 est invalide ou expiré'}
                  {data.status === 'unknown' && 'Aucune vérification effectuée'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Dernière vérification : {formatLastCheck(data.lastCheck)}
                </p>
              </div>
            </div>

            {/* Alerte si token invalide */}
            {data.status === 'invalid' && (
              <div className="flex items-start gap-2 rounded-md px-3 py-2 text-sm bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <p>
                  Le token Google Calendar est invalide. Les événements ne seront
                  pas synchronisés. Cliquez sur &laquo;&nbsp;Réautoriser&nbsp;&raquo;
                  pour relancer la procédure.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-3 flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void checkNow()}
                disabled={isChecking}
                className="text-xs"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="size-3 mr-1.5 animate-spin" />
                    Vérification en cours…
                  </>
                ) : (
                  'Vérifier maintenant'
                )}
              </Button>

              {/* Bouton réautorisation — visible quand invalide ou inconnu */}
              {data.status !== 'valid' && (
                <Button
                  size="sm"
                  variant={data.status === 'invalid' ? 'default' : 'outline'}
                  className="text-xs"
                  asChild
                >
                  <a href="/api/auth/google/authorize">
                    <ExternalLink className="size-3 mr-1.5" />
                    Réautoriser
                  </a>
                </Button>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Impossible de charger les données.</p>
        )}
      </CardContent>
    </Card>
  );
}
