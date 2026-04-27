/**
 * Utilitaires timezone — Derviche Diffusion
 *
 * Les colonnes `slots.date` (DATE) et `slots.time` (TIME) sont stockées
 * en heure locale Paris **sans information de timezone**. Tout le code qui
 * compare un slot à un instant absolu (UTC, comparaison de fenêtres, etc.)
 * doit passer par `parisDateTimeToUtcMs()` pour interpréter correctement
 * la wall-clock Paris.
 *
 * Le pattern « offset dynamique Paris » est déjà utilisé pour les événements
 * Google Calendar (`google-calendar/queries.ts` → `buildDateTimeWithParisTz`).
 * Cet util factorise et expose l'opération inverse : à partir d'une wall-clock
 * Paris, retourner l'instant UTC en millisecondes.
 *
 * Pourquoi un util et non `new Date(...)` :
 *   - `new Date('2026-04-27T19:00:00')` dépend du fuseau du serveur Node.
 *   - Sur Vercel (serveur UTC) → 19h00 UTC, soit 21h00 Paris en été.
 *     ⇒ décalage de 2h sur les fenêtres de rappel email H-4 / J-2 / J-7.
 *   - Avec `new Date('2026-04-27T19:00:00Z')` → 19h00 UTC = 21h00 Paris.
 *   - Avec cet util → 19h00 Paris = 17h00 UTC. ✓
 */

const PARIS_TZ = 'Europe/Paris';

/**
 * Convertit une wall-clock Paris (date YYYY-MM-DD + time HH:MM[:SS]) en
 * timestamp UTC en millisecondes, en gérant l'heure d'été / heure d'hiver.
 *
 * @param date - Date au format ISO `YYYY-MM-DD` (ex: `2026-04-27`)
 * @param time - Heure au format `HH:MM` ou `HH:MM:SS` (ex: `19:00` ou `19:00:00`)
 * @returns Timestamp UTC en ms, ou `NaN` si l'entrée est invalide.
 *
 * @example
 *   parisDateTimeToUtcMs('2026-04-27', '19:00:00')
 *   // En CEST (été UTC+2) : 17:00:00 UTC du 2026-04-27 → 1840561200000
 *
 *   parisDateTimeToUtcMs('2026-01-15', '19:00:00')
 *   // En CET (hiver UTC+1) : 18:00:00 UTC du 2026-01-15
 *
 * ## Edge cases DST (transitions été/hiver)
 *
 * **Trou DST (dernier dimanche de mars)** : 02:00-02:59 Paris n'existe pas
 * (l'horloge saute directement à 03:00). Pour `time = '02:30'` ce jour-là,
 * la fonction retourne une valeur déterministe (équivalent à 03:30 CEST),
 * mais cette wall-clock est métier-invalide. La codebase n'autorise pas la
 * création de slots à ces heures-là (les spectacles commencent typiquement
 * entre 14h et 22h Paris), donc le risque opérationnel est nul.
 *
 * **Recouvrement DST (dernier dimanche d'octobre)** : 02:00-02:59 Paris
 * existe deux fois (CEST puis CET). La fonction est déterministe — elle
 * retourne l'instant CEST (première occurrence) à cause du parsage initial
 * en « naive UTC ». Là encore, hors plage usuelle des slots.
 *
 * Si un jour le besoin métier inclut des slots dans ces plages, prévoir
 * un paramètre explicite `disambiguation: 'first' | 'second' | 'reject'`.
 */
export function parisDateTimeToUtcMs(date: string, time: string): number {
  if (!date || !time) return NaN;

  // Normalise l'heure en HH:MM:SS
  const normalizedTime = time.length === 5 ? `${time}:00` : time;

  // Étape 1 : construit un Date en interprétant la wall-clock comme UTC
  // (« naive UTC »). Ex: 2026-04-27T19:00:00Z.
  const naiveUtcMs = Date.parse(`${date}T${normalizedTime}Z`);
  if (Number.isNaN(naiveUtcMs)) return NaN;

  // Étape 2 : calcule la wall-clock Paris correspondante à cet instant UTC.
  // En CEST (UTC+2), `naiveUtcMs` représenté en Paris affichera 21h00.
  // L'écart entre la wall-clock Paris affichée et la wall-clock attendue
  // donne l'offset Paris à cette date précise.
  const parisWallMs = wallClockMsInTimeZone(naiveUtcMs, PARIS_TZ);

  // Offset Paris en ms (positif en CET/CEST puisque Paris est en avance sur UTC)
  const offsetMs = parisWallMs - naiveUtcMs;

  // Étape 3 : pour obtenir l'instant UTC correspondant à la wall-clock Paris
  // d'origine, on retire l'offset.
  return naiveUtcMs - offsetMs;
}

/**
 * Donne la wall-clock (mur d'horloge) d'un instant UTC dans une timezone donnée,
 * sous forme de timestamp UTC fictif. C'est un détour technique pour calculer
 * l'offset entre UTC et la timezone à un instant donné, sans dépendre d'une lib.
 *
 * @internal
 */
function wallClockMsInTimeZone(utcMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(new Date(utcMs));
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }

  // Cas spécial : minuit en certaines locales s'affiche comme 24:xx au lieu de 00:xx
  const hour = Number(map.hour) === 24 ? 0 : Number(map.hour);

  return Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second),
  );
}
