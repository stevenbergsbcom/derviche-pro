/**
 * Client-side logging helper — Service Logs
 * Derviche Diffusion — S190
 *
 * Envoie les logs d'activité depuis le navigateur (PWA check-in)
 * vers le serveur via POST /api/admin/log-activity.
 *
 * Fire & forget : les erreurs sont silencieusement ignorées.
 * Ne doit JAMAIS bloquer ni faire échouer l'opération métier.
 */

import type { LogCategory } from './types';

interface LogActivityClientParams {
  category:        LogCategory;
  action:          string;
  success:         boolean;
  actor_id?:       string | null;
  actor_role?:     string | null;
  reservation_id?: string | null;
  details?:        Record<string, unknown>;
}

/**
 * Envoie un log d'activité depuis le client (browser).
 * Non-bloquant — fire & forget.
 */
export function logActivityClient(params: LogActivityClientParams): void {
  void fetch('/api/admin/log-activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).catch(() => {
    // Fire & forget — ne jamais propager l'erreur
  });
}
