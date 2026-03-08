/**
 * CheckinEmailsSection - Envoi d'emails post-visite depuis le drawer
 * Derviche Diffusion
 *
 * Affiche les boutons d'email pertinents selon le statut courant (local ou BDD).
 * S'affiche immédiatement après le clic sur un statut, sans attendre la fermeture.
 * Un badge "✓ Envoyé le JJ/MM" s'affiche si l'email a déjà été envoyé.
 *
 * Visible uniquement si :
 *  - La réservation est confirmée (non annulée)
 *  - Un statut est sélectionné (currentStatus)
 *  - L'utilisateur peut envoyer des emails checkin (admin, super-admin, externe, company)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mail, CheckCircle, Loader2, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { CheckinStatus } from '@/types/database';
import type { CheckinFollowupTemplateKey } from '@/types/email-templates';
import type { ReservationRowData } from '@/components/accueil/ReservationRow';

// ============================================
// TYPES
// ============================================

export interface CheckinEmailsSectionProps {
  /** Réservation courante */
  reservation: ReservationRowData;
  /** Statut actuellement sélectionné (local, peut précéder la BDD après auto-save) */
  currentStatus: CheckinStatus | null;
  /** Vrai pour tout rôle autorisé : admin, super-admin, externe, company */
  canSendCheckinEmails: boolean;
}

interface EmailConfig {
  templateKey: CheckinFollowupTemplateKey;
  label: string;
  description: string;
}

interface SentEmail {
  templateKey: CheckinFollowupTemplateKey;
  sentAt: string;
}

// ============================================
// CONFIGURATION : statut → email(s) proposés
// ============================================

const EMAIL_BY_STATUS: Record<CheckinStatus, EmailConfig[]> = {
  present_neutral: [
    {
      templateKey: 'checkin_thank_you',
      label: 'Remerciement de visite',
      description: 'Merci d\'être venu, résumé du spectacle',
    },
  ],
  present_loved: [
    {
      templateKey: 'checkin_loved',
      label: 'Coup de cœur',
      description: 'Remerciement spécial + invitation à programmer',
    },
  ],
  present_press: [
    {
      templateKey: 'checkin_press',
      label: 'Suivi presse',
      description: 'Remerciement + dossier de presse',
    },
  ],
  absent: [
    {
      templateKey: 'checkin_followup_absent',
      label: 'Suivi absence',
      description: 'Regret de l\'absence + prochaines dates',
    },
  ],
};

// ============================================
// HELPERS
// ============================================

function formatSentDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
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

export function CheckinEmailsSection({
  reservation,
  currentStatus,
  canSendCheckinEmails,
}: CheckinEmailsSectionProps) {
  // Masquer si rôle non autorisé, réservation annulée ou pas encore pointée
  if (!canSendCheckinEmails) return null;
  if (reservation.status === 'cancelled') return null;
  if (!currentStatus) return null;

  // Récupérer les emails à proposer pour le statut courant
  const emailConfigs = EMAIL_BY_STATUS[currentStatus] ?? [];
  if (emailConfigs.length === 0) return null;

  return (
    <CheckinEmailsSectionInner
      reservation={reservation}
      emailConfigs={emailConfigs}
    />
  );
}

// ─── Sous-composant avec état (séparé pour éviter les hooks conditionnels) ───

interface InnerProps {
  reservation: ReservationRowData;
  emailConfigs: EmailConfig[];
}

function CheckinEmailsSectionInner({ reservation, emailConfigs }: InnerProps) {
  const [sentEmails, setSentEmails] = useState<SentEmail[]>(
    (reservation.checkinFollowupEmails ?? []).map((e: { templateKey: string; sentAt: string }) => ({
      templateKey: e.templateKey as CheckinFollowupTemplateKey,
      sentAt: e.sentAt,
    }))
  );

  const [sending, setSending] = useState<Set<CheckinFollowupTemplateKey>>(new Set());
  const [errors, setErrors] = useState<Partial<Record<CheckinFollowupTemplateKey, string>>>({});

  // Resynchroniser l'état local quand la réservation change (autre invité ouvert dans le drawer)
  useEffect(() => {
    setSentEmails(
      (reservation.checkinFollowupEmails ?? []).map((e) => ({
        templateKey: e.templateKey as CheckinFollowupTemplateKey,
        sentAt: e.sentAt,
      }))
    );
    setSending(new Set());
    setErrors({});
  }, [reservation.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const getSentEmail = useCallback(
    (key: CheckinFollowupTemplateKey): SentEmail | undefined =>
      sentEmails.find((e) => e.templateKey === key),
    [sentEmails]
  );

  const handleSend = useCallback(
    async (templateKey: CheckinFollowupTemplateKey) => {
      if (sending.has(templateKey)) return;

      setErrors((prev) => {
        const next = { ...prev };
        delete next[templateKey];
        return next;
      });

      setSending((prev) => new Set(prev).add(templateKey));

      try {
        const res = await fetch('/api/emails/send-checkin-followup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservationId: reservation.id, templateKey }),
        });

        const data = (await res.json()) as { success: boolean; error?: string };

        if (!res.ok || !data.success) {
          const msg = data.error ?? 'Erreur lors de l\'envoi';
          logger.error('[CheckinEmailsSection] Échec envoi', { templateKey, msg });
          setErrors((prev) => ({ ...prev, [templateKey]: msg }));
          return;
        }

        const now = new Date().toISOString();
        setSentEmails((prev) => [
          ...prev.filter((e) => e.templateKey !== templateKey),
          { templateKey, sentAt: now },
        ]);

        logger.info('[CheckinEmailsSection] Email envoyé', { templateKey });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur réseau';
        logger.error('[CheckinEmailsSection] Exception', { templateKey, err });
        setErrors((prev) => ({ ...prev, [templateKey]: msg }));
      } finally {
        setSending((prev) => {
          const next = new Set(prev);
          next.delete(templateKey);
          return next;
        });
      }
    },
    [reservation.id, sending]
  );

  return (
    <div>
      <p className="text-base font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Mail className="w-4 h-4" aria-hidden="true" />
        Emails post-visite
      </p>

      {!reservation.guestEmail && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>Aucun email renseigné pour cet invité.</span>
        </div>
      )}

      {reservation.guestEmail && (
        <div className="space-y-3">
          {emailConfigs.map((config) => {
            const isSending = sending.has(config.templateKey);
            const sentEmail = getSentEmail(config.templateKey);
            const isSent = Boolean(sentEmail);
            const error = errors[config.templateKey];

            return (
              <div
                key={config.templateKey}
                className={cn(
                  'flex items-start justify-between gap-3 p-3 rounded-lg border',
                  isSent ? 'bg-green-50/60 border-green-200' : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', isSent ? 'text-green-800' : 'text-gray-800')}>
                    {config.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>

                  {isSent && sentEmail && (
                    <p className="flex items-center gap-1 text-xs text-green-700 mt-1.5 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      Envoyé le {formatSentDate(sentEmail.sentAt)}
                    </p>
                  )}

                  {error && (
                    <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      {error}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {!isSent ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleSend(config.templateKey)}
                      disabled={isSending}
                      aria-label={`Envoyer : ${config.label}`}
                      className="text-sm h-8 px-3"
                    >
                      {isSending ? (
                        <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" aria-hidden="true" />Envoi…</>
                      ) : (
                        <><Mail className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />Envoyer</>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleSend(config.templateKey)}
                      disabled={isSending}
                      aria-label={`Renvoyer : ${config.label}`}
                      className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
                    >
                      {isSending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <><RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden="true" />Renvoyer</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
