'use client';

/**
 * Hook `useScrollToHash`
 *
 * Gère le scroll vers une ancre (`#id`) après une navigation Next.js App
 * Router. Le comportement natif des ancres `/#section` n'est **pas fiable**
 * quand on navigue d'une page à une autre via `<Link>` : le scroll ne se
 * déclenche pas toujours si la section n'est pas encore montée au moment où
 * l'URL est appliquée.
 *
 * Ce hook :
 *   1. Lit `window.location.hash` au premier rendu de la page.
 *   2. Utilise un `requestAnimationFrame` pour laisser le layout se stabiliser.
 *   3. Cherche l'élément cible, scrolle dessus avec `behavior: 'smooth'`.
 *   4. Retry court (jusqu'à 500 ms) si l'élément n'est pas encore dans le DOM
 *      (contenu dynamique, Suspense, données async).
 *
 * À monter dans les layouts publics (ou un provider) qui hébergent des
 * sections ancrables (`#contact`, `#impact`, etc.).
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const MAX_RETRY_MS = 500;
const RETRY_INTERVAL_MS = 50;

export function useScrollToHash(): void {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    // `#id` peut contenir des caractères encodés (URL-encoded) selon le navigateur.
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }

    let cancelled = false;
    let elapsed = 0;

    const tryScroll = (): void => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (el) {
        // Laisse le layout se stabiliser avant de scroller (Next peut encore
        // hydrater / streamer des sections plus bas).
        requestAnimationFrame(() => {
          if (cancelled) return;
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return;
      }
      if (elapsed >= MAX_RETRY_MS) return;
      elapsed += RETRY_INTERVAL_MS;
      window.setTimeout(tryScroll, RETRY_INTERVAL_MS);
    };

    tryScroll();

    return () => {
      cancelled = true;
    };
    // `pathname` en dep : si l'utilisateur navigue d'une page à une autre et
    // que l'URL finale contient un hash, on retente le scroll.
  }, [pathname]);
}
