/**
 * CheckinAndEmailsSection - Statut de checkin + emails post-visite
 * Derviche Diffusion
 *
 * Section affichée en haut du dialog d'édition admin.
 * Permet de :
 *  - Voir et modifier le statut de checkin (4 boutons)
 *  - Voir les emails déjà envoyés (badge "Envoyé le JJ/MM")
 *  - Envoyer / renvoyer un email post-visite
 *
 * Masquée si la réservation est annulée.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Check, Heart, Newspaper, X, RotateCcw,
  Mail, CheckCircle, Loader2, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { CheckinStatus } from '@/types/database';
import type { CheckinFollowupTemplateKey } from '@/types/email-templates';

// ============================================
// TYPES
// ============================================

export interface SentFollowupEmail {
  id: string;
  templateKey: string;
  sentAt: string;
  sentBy: string | null;
}

export interface CheckinAndEmailsSectionProps {
  reservationId: string;
  reservationStatus: 'confirmed' | 'cancelled' | 'no_show';
  currentCheckinStatus: CheckinStatus | null;
  guestEmail: string | null;
  checkinFollowupEmails: SentFollowupEmail[];
  /** En cours de sauvegarde du formulaire parent ? */
  isSaving: boolean;
  /** Callback déclenché après changement de statut checkin */
  onCheckinChange: (status: CheckinStatus | null) => void;
}

// ============================================
// CONFIG STATUTS
// ============================================

const STATUS_CONFIGS = [
  {
    status: 'present_neutral' as CheckinStatus,
    label: 'Présent',
    icon: Check,
    color: 'text-green-700',
    bg: 'bg-green-50 hover:bg-green-100 border-green-200',
    activeBg: 'bg-green-500 border-green-600 text-white',
  },
  {
    status: 'present_loved' as CheckinStatus,
    label: 'Coup de cœur',
    icon: Heart,
    color: 'text-pink-700',
    bg: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
    activeBg: 'bg-pink-500 border-pink-600 text-white',
  },
  {
    status: 'present_press' as CheckinStatus,
    label: 'Presse',
    icon: Newspaper,
    color: 'text-blue-700',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    activeBg: 'bg-blue-500 border-blue-600 text-white',
  },
  {
    status: 'absent' as CheckinStatus,
    label: 'Absent',
    icon: X,
    color: 'text-red-700',
    bg: 'bg-red-50 hover:bg-red-100 border-red-200',
    activeBg: 'bg-red-500 border-red-600 text-white',
  },
] as const;

// ============================================
// CONFIG EMAILS PAR STATUT
// ============================================

interface EmailConfig {
  templateKey: CheckinFollowupTemplateKey;
  label: string;
}

const EMAILS_BY_STATUS: Partial<Record<CheckinStatus, EmailConfig>> = {
  present_neutral: { templateKey: 'checkin_thank_you',      label: 'Remerciement de visite' },
  present_loved:   { templateKey: 'checkin_loved',           label: 'Coup de cœur' },
  present_press:   { templateKey: 'checkin_press',           label: 'Suivi presse' },
  absent:          { templateKey: 'checkin_followup_absent', label: 'Suivi absence' },
};

// ============================================
// HELPERS
// ============================================

function formatSentDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ============================================
// COMPOSANT
// ============================================

export function CheckinAndEmailsSection({
  reservationId,
  reservationStatus,
  currentCheckinStatus,
  guestEmail,
  checkinFollowupEmails,
  isSaving,
  onCheckinChange,
}: CheckinAndEmailsSectionProps) {
  // ─── Tous les hooks en premier (règles des hooks) ─────────────────────────

  const [localSentEmails, setLocalSentEmails] = useState<SentFollowupEmail[]>(checkinFollowupEmails);
  const [sending, setSending] = useState<Set<CheckinFollowupTemplateKey>>(new Set());
  const [errors, setErrors] = useState<Partial<Record<CheckinFollowupTemplateKey, string>>>({});

  const handleSendEmail = useCallback(async (templateKey: CheckinFollowupTemplateKey) => {
    if (sending.has(templateKey)) return;

    setErrors((prev) => { const n = { ...prev }; delete n[templateKey]; return n; });
    setSending((prev) => new Set(prev).add(templateKey));

    try {
      const res = await fetch('/api/emails/send-checkin-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, templateKey }),
      });

      const data = (await res.json()) as { success: boolean; error?: string };

      if (!res.ok || !data.success) {
        const msg = data.error ?? "Erreur lors de l'envoi";
        setErrors((prev) => ({ ...prev, [templateKey]: msg }));
        logger.error('[CheckinAndEmailsSection] Échec envoi', { templateKey, msg });
        return;
      }

      const now = new Date().toISOString();
      setLocalSentEmails((prev) => {
        const filtered = prev.filter((e) => e.templateKey !== templateKey);
        return [...filtered, { id: now, templateKey, sentAt: now, sentBy: null }];
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      setErrors((prev) => ({ ...prev, [templateKey]: msg }));
      logger.error('[CheckinAndEmailsSection] Exception', { err });
    } finally {
      setSending((prev) => { const n = new Set(prev); n.delete(templateKey); return n; });
    }
  }, [reservationId, sending]);

  // ─── Early return (après tous les hooks) ─────────────────────────────────

  if (reservationStatus === 'cancelled') return null;

  // ─── Variables dérivées ───────────────────────────────────────────────────

  const emailConfig = currentCheckinStatus
    ? EMAILS_BY_STATUS[currentCheckinStatus]
    : undefined;

  const sentEmail = emailConfig
    ? localSentEmails.find((e) => e.templateKey === emailConfig.templateKey)
    : undefined;

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Statut de présence ────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">
          Statut de présence
        </p>

        <div className="grid grid-cols-4 gap-2">
          {STATUS_CONFIGS.map((cfg) => {
            const Icon = cfg.icon;
            const isActive = currentCheckinStatus === cfg.status;
            return (
              <button
                key={cfg.status}
                type="button"
                disabled={isSaving}
                onClick={() => onCheckinChange(isActive ? null : cfg.status)}
                aria-pressed={isActive}
                aria-label={cfg.label}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all text-xs font-medium',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400',
                  isActive ? cfg.activeBg : cn(cfg.bg, cfg.color),
                  isSaving && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive && 'text-white')} aria-hidden="true" />
                <span className={isActive ? 'text-white' : ''}>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Badge statut actuel */}
        <div className="flex items-center justify-between mt-2">
          {currentCheckinStatus ? (
            <Badge variant="outline" className="text-xs">
              {STATUS_CONFIGS.find((c) => c.status === currentCheckinStatus)?.label ?? currentCheckinStatus}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs text-muted-foreground">
              Non pointé
            </Badge>
          )}
          {currentCheckinStatus && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCheckinChange(null)}
              disabled={isSaving}
              className="h-6 text-xs text-muted-foreground px-2"
            >
              <RotateCcw className="w-3 h-3 mr-1" aria-hidden="true" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* ── Email post-visite ─────────────────────────────────────────────── */}
      {currentCheckinStatus && emailConfig && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Mail className="w-4 h-4" aria-hidden="true" />
              Email post-visite
            </p>

            {/* Pas d'email renseigné */}
            {!guestEmail ? (
              <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Aucun email renseigné pour cet invité.
              </div>
            ) : (
              <div className={cn(
                'flex items-center justify-between gap-3 p-3 rounded-lg border',
                sentEmail ? 'bg-green-50/60 border-green-200' : 'bg-gray-50 border-gray-200'
              )}>
                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    sentEmail ? 'text-green-800' : 'text-gray-800'
                  )}>
                    {emailConfig.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    → {guestEmail}
                  </p>

                  {/* Badge envoyé */}
                  {sentEmail && (
                    <p className="flex items-center gap-1 text-xs text-green-700 mt-1 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      Envoyé le {formatSentDate(sentEmail.sentAt)}
                    </p>
                  )}

                  {/* Erreur */}
                  {errors[emailConfig.templateKey] && (
                    <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      {errors[emailConfig.templateKey]}
                    </p>
                  )}
                </div>

                {/* Bouton Envoyer / Renvoyer */}
                {!sentEmail ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleSendEmail(emailConfig.templateKey)}
                    disabled={sending.has(emailConfig.templateKey) || isSaving}
                    className="shrink-0 text-sm h-8 px-3"
                  >
                    {sending.has(emailConfig.templateKey) ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" aria-hidden="true" />
                        Envoi…
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                        Envoyer
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleSendEmail(emailConfig.templateKey)}
                    disabled={sending.has(emailConfig.templateKey) || isSaving}
                    className="shrink-0 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {sending.has(emailConfig.templateKey) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                        Renvoyer
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <Separator />
    </div>
  );
}
