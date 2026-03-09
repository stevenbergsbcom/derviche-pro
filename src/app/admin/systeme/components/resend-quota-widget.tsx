/**
 * ResendQuotaWidget — Suivi du quota email mensuel Resend
 * Derviche Diffusion
 *
 * Affiche :
 *   - Nombre d'emails envoyés ce mois-ci (comptage local depuis app_logs)
 *   - Limite du plan actuel (free = 3000, pro = valeur libre)
 *   - Barre de progression (verte → orange → rouge selon %)
 *   - Alerte + lien Resend si > 80%
 *   - Boutons pour changer de plan (free ↔ pro)
 *   - Input quota personnalisé quand plan = pro
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw, TrendingUp, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

type ResendPlan = 'free' | 'pro';

interface QuotaData {
  sentThisMonth: number;
  plan: ResendPlan;
  monthlyQuota: number;
}

// ============================================
// CONSTANTES
// ============================================

const FREE_QUOTA     = 3000;
const WARN_THRESHOLD = 0.8;  // 80% → alerte orange
const CRIT_THRESHOLD = 1.0;  // 100% → alerte rouge

// ============================================
// HELPERS
// ============================================

function getProgressColor(ratio: number): string {
  if (ratio >= CRIT_THRESHOLD) return 'bg-red-500';
  if (ratio >= WARN_THRESHOLD) return 'bg-orange-400';
  return 'bg-emerald-500';
}

function getProgressBg(ratio: number): string {
  if (ratio >= CRIT_THRESHOLD) return 'bg-red-100 dark:bg-red-950/30';
  if (ratio >= WARN_THRESHOLD) return 'bg-orange-100 dark:bg-orange-950/30';
  return 'bg-muted';
}

function formatMonth(): string {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/**
 * Normalise la valeur lue depuis app_settings (colonne JSONB).
 *
 * Supabase désérialise automatiquement le JSONB :
 *   - Une chaîne stockée en JSON  → rendue comme string JS  (ex: "free")
 *   - Un nombre stocké en JSON    → rendu  comme number JS  (ex: 3000)
 *
 * NB : les anciennes lignes stockées avec l'ancienne syntaxe '"free"'
 * (guillemets inclus dans la valeur) sont gérées par le trim des quotes.
 */
function normalizePlan(raw: unknown): ResendPlan {
  if (typeof raw !== 'string') return 'free';
  const clean = raw.replace(/^"|"$/g, ''); // garde-fou si double-encodé
  return clean === 'pro' ? 'pro' : 'free';
}

function normalizeQuota(raw: unknown): number {
  if (typeof raw === 'number' && raw > 0) return raw;
  // garde-fou : chaîne numérique
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n > 0) return n;
  }
  return FREE_QUOTA;
}

// ============================================
// COMPOSANT
// ============================================

export function ResendQuotaWidget() {
  const [data,         setData]         = useState<QuotaData | null>(null);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSaving,     setIsSaving]     = useState(false);
  const [proQuotaInput, setProQuotaInput] = useState('');
  const [showProInput,  setShowProInput]  = useState(false);

  // ── Chargement ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const supabase = createClient();

      // 1. Récupérer le plan et le quota depuis app_settings
      const { data: settings, error: settingsErr } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['resend_plan', 'resend_monthly_quota']);

      if (settingsErr) throw new Error(settingsErr.message);

      const plan         = normalizePlan(settings?.find(s => s.key === 'resend_plan')?.value);
      const monthlyQuota = normalizeQuota(settings?.find(s => s.key === 'resend_monthly_quota')?.value);

      // 2. Compter les emails envoyés ce mois-ci depuis app_logs
      const now        = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count, error: countErr } = await supabase
        .from('app_logs')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'email')
        .eq('status', 'success')
        .gte('created_at', startMonth);

      if (countErr) throw new Error(countErr.message);

      setData({ sentThisMonth: count ?? 0, plan, monthlyQuota });

      // Pré-remplir l'input pro avec la valeur actuelle si plan pro
      if (plan === 'pro') {
        setProQuotaInput(String(monthlyQuota));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Changement de plan ─────────────────────────────────────────────────────
  const switchToFree = useCallback(async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();

      // Valeurs directes (string / number) — Supabase sérialise en JSONB automatiquement
      const [r1, r2] = await Promise.all([
        supabase.from('app_settings').update({ value: 'free' }).eq('key', 'resend_plan'),
        supabase.from('app_settings').update({ value: FREE_QUOTA }).eq('key', 'resend_monthly_quota'),
      ]);

      if (r1.error) throw new Error(r1.error.message);
      if (r2.error) throw new Error(r2.error.message);

      setShowProInput(false);
      toast.success('Plan passé en gratuit (3 000 emails/mois)');
      void load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la mise à jour du plan : ${msg}`);
    } finally {
      setIsSaving(false);
    }
  }, [load]);

  const switchToPro = useCallback(async () => {
    const quota = parseInt(proQuotaInput, 10);
    if (isNaN(quota) || quota < 1) {
      toast.error('Quota invalide — saisissez un nombre entier positif');
      return;
    }
    setIsSaving(true);
    try {
      const supabase = createClient();

      const [r1, r2] = await Promise.all([
        supabase.from('app_settings').update({ value: 'pro' }).eq('key', 'resend_plan'),
        supabase.from('app_settings').update({ value: quota }).eq('key', 'resend_monthly_quota'),
      ]);

      if (r1.error) throw new Error(r1.error.message);
      if (r2.error) throw new Error(r2.error.message);

      setShowProInput(false);
      toast.success(`Plan pro — quota mis à jour : ${quota.toLocaleString('fr-FR')} emails/mois`);
      void load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la mise à jour du plan : ${msg}`);
    } finally {
      setIsSaving(false);
    }
  }, [proQuotaInput, load]);

  // ── Calculs ────────────────────────────────────────────────────────────────
  const ratio     = data ? Math.min(data.sentThisMonth / data.monthlyQuota, 1) : 0;
  const pct       = Math.round(ratio * 100);
  const isWarning = ratio >= WARN_THRESHOLD;

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Mail className="size-4 text-muted-foreground" />
            Quota Resend — {formatMonth()}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Badge plan */}
            <Badge variant={data?.plan === 'pro' ? 'default' : 'secondary'}>
              {data?.plan === 'pro' ? 'Plan Pro' : 'Plan Gratuit'}
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
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
          </div>
        ) : loadError ? (
          /* Erreur de chargement visible */
          <p className="text-sm text-red-600">
            Impossible de charger les données : {loadError}
          </p>
        ) : data ? (
          <>
            {/* Compteur */}
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold tabular-nums">
                  {data.sentThisMonth.toLocaleString('fr-FR')}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  / {data.monthlyQuota.toLocaleString('fr-FR')} emails
                </span>
              </div>
              <span className={cn(
                'text-sm font-semibold tabular-nums',
                pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-orange-500' : 'text-emerald-600'
              )}>
                {pct}%
              </span>
            </div>

            {/* Barre de progression */}
            <div className={cn('h-2.5 w-full rounded-full', getProgressBg(ratio))}>
              <div
                className={cn('h-full rounded-full transition-all duration-500', getProgressColor(ratio))}
                style={{ width: `${Math.min(pct, 100)}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${pct}% du quota utilisé`}
              />
            </div>

            {/* Alerte si > 80% */}
            {isWarning && (
              <div className={cn(
                'flex items-start gap-2 rounded-md px-3 py-2 text-sm',
                pct >= 100
                  ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                  : 'bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300'
              )}>
                <TrendingUp className="size-4 mt-0.5 shrink-0" />
                <div className="flex-1">
                  {pct >= 100
                    ? 'Quota atteint — les emails suivants seront refusés par Resend.'
                    : `Attention — ${pct}% du quota utilisé ce mois-ci.`
                  }
                  <a
                    href="https://resend.com/pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 inline-flex items-center gap-0.5 underline underline-offset-2 font-medium"
                  >
                    Voir les plans Resend
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Actions changement de plan */}
            <div className="border-t pt-3 space-y-3">
              {data.plan === 'free' ? (
                /* Plan gratuit → proposer de passer au pro */
                showProInput ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Quota mensuel (ex: 50000)"
                      value={proQuotaInput}
                      onChange={e => setProQuotaInput(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => void switchToPro()}
                      disabled={isSaving}
                      className="shrink-0"
                    >
                      Confirmer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowProInput(false)}
                      disabled={isSaving}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowProInput(true)}
                    className="text-xs"
                  >
                    Passé au plan payant ?
                  </Button>
                )
              ) : (
                /* Plan pro → proposer de revenir au gratuit ou modifier le quota */
                <div className="flex items-center gap-2 flex-wrap">
                  {showProInput ? (
                    <>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Nouveau quota mensuel"
                        value={proQuotaInput}
                        onChange={e => setProQuotaInput(e.target.value)}
                        className="h-8 text-sm w-48"
                      />
                      <Button
                        size="sm"
                        onClick={() => void switchToPro()}
                        disabled={isSaving}
                        className="shrink-0"
                      >
                        Confirmer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowProInput(false)}
                        disabled={isSaving}
                      >
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowProInput(true)}
                        className="text-xs"
                      >
                        Modifier le quota
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void switchToFree()}
                        disabled={isSaving}
                        className="text-xs text-muted-foreground"
                      >
                        Repassé au plan gratuit
                      </Button>
                    </>
                  )}
                </div>
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
