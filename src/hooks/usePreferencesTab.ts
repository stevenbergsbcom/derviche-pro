/**
 * Hook usePreferencesTab
 * Derviche Diffusion
 *
 * Lit l'onglet Préférences actif depuis `?tab=` et expose un setter qui met à
 * jour l'URL sans recharger la page. Extrait de l'ancien `preferences-tabs.tsx`.
 */

'use client';

import { useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { DEFAULT_TAB } from '@/app/admin/preferences/config/preference-tabs';

export interface UsePreferencesTabReturn {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function usePreferencesTab(): UsePreferencesTabReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get('tab') || DEFAULT_TAB;

  const setActiveTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return { activeTab, setActiveTab };
}
