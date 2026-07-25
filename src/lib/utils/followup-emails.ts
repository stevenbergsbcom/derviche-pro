/**
 * Helpers « Emails merci » post-accueil (table checkin_followup_emails)
 * Derviche Diffusion
 *
 * Couche neutre (lib) : partagés entre le rendu du tableau admin
 * (components), l'aperçu du dialog d'export (components) et les builders
 * de fichiers CSV/Excel (hooks/admin-reservations/helpers/formatters).
 */

import { formatDateTimeFr } from '@/lib/utils/format-date';

/**
 * Labels courts des 4 types d'emails merci, alignés sur la terminologie
 * du client : présent / cœur / presse / absent.
 * Une clé inconnue (futur template) est affichée telle quelle en fallback.
 */
export const FOLLOWUP_EMAIL_TYPE_LABELS: Record<string, string> = {
  checkin_thank_you: 'Présent',
  checkin_loved: 'Coup de cœur',
  checkin_press: 'Presse',
  checkin_followup_absent: 'Absent',
};

/**
 * Formate la liste des emails merci envoyés pour une cellule d'export :
 * « Présent 12 juil. 2026 14:32 ; Coup de cœur 12 juil. 2026 14:35 ».
 * Tri chronologique. Chaîne vide si aucun envoi.
 */
export function formatFollowupEmailsList(
  emails: { templateKey: string; sentAt: string }[],
): string {
  return [...emails]
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
    .map((e) => {
      const label = FOLLOWUP_EMAIL_TYPE_LABELS[e.templateKey] ?? e.templateKey;
      return `${label} ${formatDateTimeFr(e.sentAt)}`;
    })
    .join(' ; ');
}
