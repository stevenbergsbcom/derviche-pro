/**
 * grouping-helpers — Regroupement des réservations compagnie par représentation
 * Derviche Diffusion — S198
 *
 * Le groupement se fait côté client à partir du tableau plat `CompanyReservation[]`
 * retourné par `useCompanyReservations()`. L'ordre chronologique est préservé
 * via la sémantique `Map` JS (ordre d'insertion = ordre du service avec
 * sortBy=slot_date_asc).
 */

import type {
  CompanyReservation,
  CompanyReservationSlot,
} from '@/lib/services/company-reservations';

export interface ReservationGroup {
  /** Identifiant stable du groupe (`slotId` ou `'unknown'` si slot manquant). */
  key: string;
  /** Slot complet si disponible — sert à afficher le header. */
  slot: CompanyReservationSlot | null;
  /** Réservations du slot, dans l'ordre reçu du service. */
  items: CompanyReservation[];
}

const UNKNOWN_KEY = 'unknown';

/**
 * Regroupe les réservations par `slotId`. Préserve l'ordre d'apparition
 * (déjà chronologique grâce au tri service `slot_date_asc`).
 *
 * - Les réservations orphelines (slot null) sont regroupées sous la clé
 *   « unknown » en fin de liste pour ne pas casser le rendu.
 */
export function groupReservationsBySlot(
  reservations: CompanyReservation[],
): ReservationGroup[] {
  const map = new Map<string, ReservationGroup>();

  for (const r of reservations) {
    const key = r.slotId || UNKNOWN_KEY;
    const existing = map.get(key);
    if (existing) {
      existing.items.push(r);
    } else {
      map.set(key, {
        key,
        slot: r.slot,
        items: [r],
      });
    }
  }

  return Array.from(map.values());
}
