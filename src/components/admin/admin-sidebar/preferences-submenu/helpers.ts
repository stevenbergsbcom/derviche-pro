/**
 * Helpers partagés Expanded / Collapsed
 * Derviche Diffusion
 */

import { DEFAULT_TAB } from '@/app/admin/preferences/config/preference-tabs';

/** URL complète vers un onglet précis. */
export function hrefForTab(tabId: string): string {
  return `/admin/preferences?tab=${tabId}`;
}

/** Onglet actif lu dans les searchParams, fallback DEFAULT_TAB. */
export function getActiveTabId(searchParams: URLSearchParams | ReadonlyURLSearchParams | null): string {
  return searchParams?.get('tab') ?? DEFAULT_TAB;
}

/** Vrai si le pathname appartient à la section Préférences. */
export function isOnPrefsPath(pathname: string | null): boolean {
  return pathname?.startsWith('/admin/preferences') ?? false;
}

// Type helper — Next.js expose `ReadonlyURLSearchParams` depuis next/navigation
// mais on évite l'import runtime ici pour que ce fichier reste « pur ».
type ReadonlyURLSearchParams = Pick<URLSearchParams, 'get'>;
